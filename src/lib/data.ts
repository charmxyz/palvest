import "server-only";
import type { Row } from "postgres";
import { db } from "./db";
import { backerPoolOwed, round2 } from "./finance";
import type {
  Backing,
  CreatorProfile,
  Distribution,
  DistributionItem,
  Proposal,
  ProposalWithCreator,
  PublishedVideo,
} from "./types";

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : d ? String(d) : null);

export function mapCreator(r: Row): CreatorProfile {
  return {
    id: r.id,
    youtubeChannelId: r.youtube_channel_id,
    youtubeHandle: r.youtube_handle,
    channelTitle: r.channel_title,
    description: r.description,
    thumbnailUrl: r.thumbnail_url,
    subscriberCount: r.subscriber_count ?? 0,
    totalViewCount: r.total_view_count ?? 0,
    publicVideoCount: r.public_video_count ?? 0,
    assumedRpm: r.assumed_rpm ?? 4,
    videos: r.videos ?? [],
    metrics: r.metrics,
    analyzedAt: iso(r.analyzed_at)!,
    isSeed: r.is_seed,
  };
}

export function mapProposal(r: Row): Proposal {
  return {
    id: r.id,
    creatorProfileId: r.creator_profile_id,
    title: r.title,
    description: r.description,
    creatorPitch: r.creator_pitch,
    coverImageUrl: r.cover_image_url,
    fundingTarget: r.funding_target,
    amountFunded: r.amount_funded,
    revenueSharePercent: r.revenue_share_percent,
    revenueShareMonths: r.revenue_share_months,
    budget: r.budget ?? [],
    forecast: r.forecast,
    risks: r.risks ?? [],
    status: r.status,
    publishedAt: iso(r.published_at),
    createdAt: iso(r.created_at)!,
    palCount: Number(r.pal_count ?? 0),
  };
}

function mapProposalWithCreator(r: Row): ProposalWithCreator {
  return {
    ...mapProposal(r),
    creator: {
      id: r.creator_profile_id,
      channelTitle: r.channel_title,
      youtubeHandle: r.youtube_handle,
      thumbnailUrl: r.thumbnail_url,
      subscriberCount: r.subscriber_count ?? 0,
      assumedRpm: r.assumed_rpm ?? 4,
    },
  };
}

function mapPublished(r: Row): PublishedVideo {
  return {
    id: r.id,
    proposalId: r.proposal_id,
    youtubeVideoId: r.youtube_video_id,
    title: r.title,
    thumbnailUrl: r.thumbnail_url,
    publishedAt: iso(r.published_at),
    currentViews: r.current_views,
    assumedRpm: r.assumed_rpm,
    eligibleRevenue: r.eligible_revenue,
    source: r.source,
    trajectory: r.trajectory ?? [],
    updatedAt: iso(r.updated_at)!,
  };
}

function mapBacking(r: Row): Backing {
  return {
    id: r.id,
    proposalId: r.proposal_id,
    backerName: r.backer_name,
    backerEmail: r.backer_email,
    amount: r.amount,
    paypalOrderId: r.paypal_order_id,
    paypalCaptureId: r.paypal_capture_id,
    status: r.status,
    createdAt: iso(r.completed_at ?? r.created_at)!,
  };
}

function mapItem(r: Row): DistributionItem {
  return {
    id: r.id,
    distributionId: r.distribution_id,
    backerEmail: r.backer_email,
    backerName: r.backer_name,
    contributed: r.contributed,
    amount: r.amount,
    paypalItemId: r.paypal_item_id,
    transactionStatus: r.transaction_status,
  };
}

const PROPOSAL_SELECT = (sql: ReturnType<typeof db>) => sql`
  select p.*, c.channel_title, c.youtube_handle, c.thumbnail_url, c.subscriber_count, c.assumed_rpm,
    (select count(distinct lower(coalesce(b.backer_email, b.id::text))) from backings b
      where b.proposal_id = p.id and b.status = 'completed') as pal_count
  from proposals p
  join creator_profiles c on c.id = p.creator_profile_id
`;

export async function listProposals(opts: { creatorId?: string } = {}) {
  const sql = db();
  const rows = await sql`
    ${PROPOSAL_SELECT(sql)}
    where p.status <> 'draft'
    ${opts.creatorId ? sql`and p.creator_profile_id = ${opts.creatorId}` : sql``}
    order by
      case p.status when 'funding' then 0 when 'funded' then 1 else 2 end,
      p.created_at desc`;
  return rows.map(mapProposalWithCreator);
}

export async function getProposal(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sql = db();
  const [row] = await sql`${PROPOSAL_SELECT(sql)} where p.id = ${id}`;
  return row ? mapProposalWithCreator(row) : null;
}

export async function getCreator(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db()`select * from creator_profiles where id = ${id}`;
  return row ? mapCreator(row) : null;
}

/** Find a creator by URL slug: their handle without "@" (case-insensitive) or their channel ID. */
export async function getCreatorBySlug(slug: string) {
  const s = decodeURIComponent(slug).replace(/^@/, "");
  const [row] = await db()`
    select * from creator_profiles
    where lower(ltrim(youtube_handle, '@')) = lower(${s}) or youtube_channel_id = ${s}
    order by analyzed_at desc limit 1`;
  return row ? mapCreator(row) : null;
}

export async function listCreators() {
  const rows = await db()`
    select id, youtube_channel_id, channel_title, youtube_handle, thumbnail_url, subscriber_count, is_seed
    from creator_profiles order by is_seed asc, analyzed_at desc`;
  return rows.map((r) => ({
    id: r.id as string,
    youtubeChannelId: r.youtube_channel_id as string,
    channelTitle: r.channel_title as string,
    youtubeHandle: r.youtube_handle as string | null,
    thumbnailUrl: r.thumbnail_url as string | null,
    subscriberCount: r.subscriber_count as number,
    isSeed: r.is_seed as boolean,
  }));
}

export async function getBackings(proposalId: string) {
  const rows = await db()`
    select * from backings where proposal_id = ${proposalId} and status = 'completed'
    order by coalesce(completed_at, created_at) desc`;
  return rows.map(mapBacking);
}

export async function getPublishedVideo(proposalId: string) {
  const [row] = await db()`select * from published_videos where proposal_id = ${proposalId}`;
  return row ? mapPublished(row) : null;
}

export async function getDistributions(proposalId: string): Promise<Distribution[]> {
  const sql = db();
  const dists = await sql`
    select * from distributions where proposal_id = ${proposalId} order by created_at desc`;
  if (!dists.length) return [];
  const items = await sql`
    select * from distribution_items where distribution_id in ${sql(dists.map((d) => d.id))}
    order by amount desc`;
  return dists.map((d) => ({
    id: d.id,
    proposalId: d.proposal_id,
    grossEligibleRevenue: d.gross_eligible_revenue,
    backerPoolAmount: d.backer_pool_amount,
    paypalBatchId: d.paypal_batch_id,
    fundingOrderId: d.funding_order_id,
    fundingCaptureId: d.funding_capture_id,
    status: d.status,
    error: d.error,
    createdAt: iso(d.created_at)!,
    items: items.filter((i) => i.distribution_id === d.id).map(mapItem),
  }));
}

/**
 * A distribution settles the creator's obligation once they've paid it (or it was
 * recorded without PayPal). Unpaid checkouts and pre-funding failures don't count.
 */
export function countsAsDistributed(d: Pick<Distribution, "status" | "fundingCaptureId">) {
  if (d.status === "awaiting_funding") return false;
  if (d.status === "failed") return d.fundingCaptureId !== null;
  return true;
}

/** Pool owed for the published video so far, what's been distributed, and what's outstanding. */
export function settlement(p: Proposal, video: PublishedVideo | null, dists: Distribution[]) {
  const totalOwed = video
    ? backerPoolOwed(video.eligibleRevenue, p.revenueSharePercent, p.fundingTarget, p.amountFunded)
    : 0;
  const distributed = round2(
    dists.filter(countsAsDistributed).reduce((a, d) => a + d.backerPoolAmount, 0),
  );
  return {
    eligibleRevenue: video?.eligibleRevenue ?? 0,
    totalOwed,
    distributed,
    outstanding: Math.max(0, round2(totalOwed - distributed)),
    creatorShare: round2((video?.eligibleRevenue ?? 0) - totalOwed),
  };
}

export async function creatorSummary(creatorId: string) {
  const [row] = await db()`
    with pv as (
      select p.id, p.revenue_share_percent, p.funding_target, p.amount_funded, v.eligible_revenue,
        coalesce((select sum(backer_pool_amount) from distributions d
                  where d.proposal_id = p.id and d.status <> 'awaiting_funding'
                    and not (d.status = 'failed' and d.funding_capture_id is null)), 0) as distributed
      from proposals p join published_videos v on v.proposal_id = p.id
      where p.creator_profile_id = ${creatorId}
    )
    select
      (select count(*) from proposals where creator_profile_id = ${creatorId} and status = 'funding') as active,
      (select count(*) from proposals where creator_profile_id = ${creatorId} and status = 'funded') as funded,
      (select count(*) from proposals where creator_profile_id = ${creatorId} and status = 'published') as published,
      (select coalesce(sum(amount_funded), 0) from proposals where creator_profile_id = ${creatorId}) as raised,
      (select coalesce(sum(greatest(0,
         round(eligible_revenue * revenue_share_percent / 100
           * least(1, amount_funded / funding_target), 2) - distributed)), 0) from pv) as outstanding`;
  return {
    active: Number(row.active),
    funded: Number(row.funded),
    published: Number(row.published),
    raised: Number(row.raised),
    outstanding: Number(row.outstanding),
  };
}

export type PortfolioEntry = {
  proposal: ProposalWithCreator;
  contributed: number;
  backedAt: string;
  received: number;
  pending: number;
};

export async function getPortfolio(email: string) {
  const sql = db();
  const rows = await sql`
    select proposal_id, sum(amount) as contributed, max(coalesce(completed_at, created_at)) as backed_at,
      max(backer_name) as name
    from backings
    where lower(backer_email) = lower(${email}) and status = 'completed'
    group by proposal_id`;
  if (!rows.length) return { name: null as string | null, entries: [] as PortfolioEntry[] };

  const entries: PortfolioEntry[] = [];
  for (const r of rows) {
    const proposal = await getProposal(r.proposal_id);
    if (!proposal) continue;
    const [video, dists] = await Promise.all([
      getPublishedVideo(proposal.id),
      getDistributions(proposal.id),
    ]);
    const mine = dists
      .filter(countsAsDistributed)
      .flatMap((d) => d.items)
      .filter((i) => i.backerEmail.toLowerCase() === email.toLowerCase());
    const received = round2(mine.reduce((a, i) => a + i.amount, 0));
    const { outstanding } = settlement(proposal, video, dists);
    const share = r.contributed / Math.max(proposal.fundingTarget, proposal.amountFunded);
    entries.push({
      proposal,
      contributed: r.contributed,
      backedAt: iso(r.backed_at)!,
      received,
      pending: round2(outstanding * share),
    });
  }
  entries.sort((a, b) => +new Date(b.backedAt) - +new Date(a.backedAt));
  return { name: rows.find((r) => r.name)?.name ?? null, entries };
}

export async function listKnownPals(limit = 12) {
  const rows = await db()`
    select lower(backer_email) as email, max(backer_name) as name, sum(amount) as total,
      count(distinct proposal_id) as projects
    from backings where status = 'completed' and backer_email is not null
    group by lower(backer_email)
    order by count(distinct proposal_id) desc, sum(amount) desc
    limit ${limit}`;
  return rows.map((r) => ({
    email: r.email as string,
    name: r.name as string | null,
    total: Number(r.total),
    projects: Number(r.projects),
  }));
}
