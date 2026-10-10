// Idempotent schema. Run with `pnpm db:setup`, or paste db/schema.sql into the
// Supabase SQL editor.
export const SCHEMA_SQL = /* sql */ `
create extension if not exists pgcrypto;

create table if not exists creator_profiles (
  id uuid primary key default gen_random_uuid(),
  youtube_channel_id text not null unique,
  youtube_handle text,
  channel_title text not null,
  description text,
  thumbnail_url text,
  subscriber_count bigint default 0,
  total_view_count bigint default 0,
  public_video_count integer default 0,
  uploads_playlist_id text,
  assumed_rpm numeric default 4,
  videos jsonb not null default '[]',
  metrics jsonb not null default '{}',
  is_seed boolean not null default false,
  analyzed_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid not null references creator_profiles(id) on delete cascade,
  title text not null,
  description text,
  creator_pitch text,
  cover_image_url text,
  funding_target numeric not null check (funding_target > 0),
  amount_funded numeric not null default 0,
  revenue_share_percent numeric not null check (revenue_share_percent > 0 and revenue_share_percent <= 100),
  revenue_share_months integer not null default 12,
  budget jsonb not null default '[]',
  forecast jsonb not null default '{}',
  risks jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft', 'funding', 'funded', 'published')),
  published_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists proposals_creator_idx on proposals(creator_profile_id);

create table if not exists backings (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  backer_name text,
  backer_email text,
  amount numeric not null check (amount > 0),
  paypal_order_id text unique,
  paypal_capture_id text,
  paypal_payer_id text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  completed_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists backings_proposal_idx on backings(proposal_id);
create index if not exists backings_email_idx on backings(lower(backer_email));

create table if not exists published_videos (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references proposals(id) on delete cascade,
  youtube_video_id text,
  title text,
  thumbnail_url text,
  published_at timestamptz,
  current_views bigint not null default 0,
  assumed_rpm numeric not null default 4,
  eligible_revenue numeric not null default 0,
  source text not null default 'none' check (source in ('simulated', 'youtube', 'none')),
  trajectory jsonb not null default '[]',
  updated_at timestamptz default now()
);

create table if not exists distributions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  gross_eligible_revenue numeric not null,
  backer_pool_amount numeric not null,
  paypal_batch_id text,
  status text not null default 'pending',
  error text,
  created_at timestamptz default now()
);
create index if not exists distributions_proposal_idx on distributions(proposal_id);

-- Creator funds the Pal pool via PayPal checkout before Payouts go out (additive migration).
-- Guarded so re-runs don't take an exclusive lock on the table when nothing changes.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_name = 'distributions' and column_name = 'funding_order_id') then
    alter table distributions
      add column funding_order_id text unique,
      add column funding_capture_id text,
      add column funded_at timestamptz;
  end if;
  if not exists (select 1 from pg_constraint
                 where conname = 'distributions_status_check'
                   and pg_get_constraintdef(oid) like '%awaiting_funding%') then
    alter table distributions drop constraint if exists distributions_status_check;
    alter table distributions add constraint distributions_status_check
      check (status in ('awaiting_funding', 'pending', 'processing', 'success', 'failed', 'ledger_only'));
  end if;
end $$;

create table if not exists distribution_items (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid not null references distributions(id) on delete cascade,
  backer_email text not null,
  backer_name text,
  contributed numeric not null,
  amount numeric not null,
  paypal_item_id text,
  transaction_status text
);
create index if not exists distribution_items_dist_idx on distribution_items(distribution_id);
create index if not exists distribution_items_email_idx on distribution_items(lower(backer_email));
`;
