# Palvest — PayPal AI Hackathon MVP Build Plan

## Product concept

**Palvest lets fans invest in YouTube videos.**

A creator proposes a video before it is made, sets the amount they need to raise, and offers a percentage of that video's eligible revenue for a fixed period. Pals fund the proposal through PayPal. If the video earns revenue, the revenue share is distributed back to the pals who funded it.

Example:

```text
Creator wants to make a $4,000 Ireland documentary
        |
Raises $4,000 from pals
        |
Offers 20% of eligible YouTube revenue for 12 months
        |
Video gets made and published
        |
Revenue is tracked
        |
20% is distributed back to pals
```

For the hackathon MVP, Palvest is **YouTube only**. TikTok, Spotify, podcasts, music, and other creator formats are future expansion ideas, not MVP scope.

The MVP should feel like a real two sided marketplace, but it should remain one codebase and one product.

## MVP principles

1. Use one Next.js app and one repository.
2. No authentication anywhere for the hackathon MVP.
3. `/` is a normal homepage, but **do not spend time designing it**. It can simply explain Palvest and link to the two product modes.
4. `/creator` is the creator side. The creator pastes a YouTube channel, sees channel analysis, simulates funding, and creates proposals.
5. `/pals` is the fan/backer side. Pals browse proposals, open a project, fund it with PayPal, and later see their returns.
6. Use nested routes only when needed, for example `/creator/new`, `/creator/projects/[id]`, `/pals/[id]`, and `/pals/portfolio`.
7. Use Supabase Postgres for persistent data.
8. Use Vercel for hosting.
9. Use real public YouTube data where possible.
10. Use an editable RPM assumption for estimated revenue in the first version.
11. Use PayPal Sandbox for real demo payments.
12. Keep all AI outputs editable. AI should accelerate creation and analysis, not lock the creator into a generated answer.

### Product terminology

Use **Pal** as the customer-facing word for someone who funds a proposal.

```text
Creator = person proposing the video
Pal = person funding the video
Backing = the Pal's contribution
Revenue share = the percentage of eligible video revenue shared with Pals
```

In the database and API, names like `backings` are still fine. The UI should prefer `Pal`, `Back this video`, and `Revenue share`.

---

# 1. Recommended architecture

```text
                        YouTube Data API v3
                                |
                                v
Creator browser --> Next.js on Vercel <-- Pal browser
     /creator          |       |             /pals
                       |       |
                       v       v
                  AI / Forecasting
                       |
                       v
                 Supabase Postgres
                       |
                 proposal + backing data
                       |
                       v
                  PayPal Sandbox
                 Orders + Payouts
```

## Stack

| Layer | Choice |
|---|---|
| App | Next.js, TypeScript, App Router |
| Hosting | Vercel |
| Styling | Tailwind CSS, optionally shadcn/ui |
| Database | Supabase Postgres |
| Storage | Supabase Storage only if needed for proposal images |
| Auth | None for MVP |
| Creator data | YouTube Data API v3 |
| Private creator analytics | YouTube Analytics API, later upgrade |
| AI | OpenAI or another model, return structured JSON |
| Funding payment | PayPal Orders API in Sandbox |
| Pal settlement | PayPal Payouts API in Sandbox, stretch goal |

Do not use EC2, RDS, Redis, queues, or microservices unless a concrete technical need appears. They add setup work without adding visible hackathon value.

---

# 2. App routes

Use one app. There are only two important top-level product modes: **Creator** and **Pals**.

```text
/
  Basic Palvest homepage
  Keep this simple for the hackathon
  Explain the product and link to /creator and /pals

/creator
  Creator entry point
  Paste YouTube channel
  Analyze public channel performance
  Show funding simulator
  Show existing creator proposals/projects

/creator/new
  Create a new video proposal
  AI helps turn the idea into editable proposal fields

/creator/projects/[id]
  Creator view of one proposal
  Funding progress
  Published video performance
  Revenue owed to Pals
  Distribution action

/pals
  Pal marketplace
  Browse all published video proposals

/pals/[id]
  Proposal detail page
  Forecast, creator history, budget, revenue share
  Back the video through PayPal Sandbox

/pals/portfolio
  Demo Pal portfolio
  Videos backed, amount contributed, revenue earned
```

### Homepage scope

Do not spend meaningful hackathon time on `/`. It can be a simple hero such as:

```text
Palvest
Invest in YouTube videos.

Fund videos before they're made and share in the revenue when they succeed.

[I'm a creator]  [Browse videos]
```

The actual demo should move almost immediately into `/creator` or `/pals`.

No separate creator repo and Pal repo. Both sides use the same database, APIs, components, and PayPal integration.

---

# 3. YouTube API for the MVP

## What to use first

Use **YouTube Data API v3**.

Official overview:
https://developers.google.com/youtube/v3/getting-started

For public YouTube channel data, an API key is enough. You do not need creator OAuth just to read public channel and public video statistics.

The official JavaScript quickstart confirms that an API key can retrieve public channel information, while OAuth is required for user specific private data:
https://developers.google.com/youtube/v3/quickstart/js

## What public data can the MVP get?

From a public channel you can obtain data such as:

* Channel title
* Channel description
* Channel thumbnail
* Subscriber count, subject to YouTube's displayed count behavior
* Total channel view count
* Total public video count
* Upload playlist ID
* Individual public video titles
* Publish dates
* Public view counts
* Likes where available
* Video duration
* Thumbnails

This is enough to build a convincing public channel performance profile.

## What public data cannot tell you

Public YouTube APIs do **not** give you the creator's actual revenue, RPM, CPM, or estimated AdSense revenue.

For the MVP, estimate revenue using an editable RPM assumption.

Example:

```text
Estimated revenue = views / 1000 * assumed RPM
```

If assumed RPM is `$4`:

```text
500,000 views / 1000 * $4 = $2,000 estimated creator revenue
```

Label this clearly in the UI:

> Estimated using $4.00 RPM

And make `$4.00` editable.

---

# 4. How to get a YouTube Data API key

## Google Cloud setup

1. Open Google Cloud Console.
2. Create a new project, for example `palvest`.
3. Open **APIs & Services**.
4. Open **Library**.
5. Search for **YouTube Data API v3**.
6. Enable it.
7. Open **APIs & Services > Credentials**.
8. Click **Create credentials**.
9. Select **API key**.
10. Copy the API key.
11. Restrict the key before deployment.
12. For a server side Next.js implementation, keep the key server side and do not expose it as a `NEXT_PUBLIC_` variable.

Environment variable:

```bash
YOUTUBE_API_KEY=your_key_here
```

Google's official setup instructions:
https://developers.google.com/youtube/v3/quickstart/js

## Quota

YouTube Data API uses quota. Google's current documentation says enabled projects receive a default allocation, with common read methods such as `channels.list`, `videos.list`, and `playlistItems.list` being inexpensive. For this MVP, normal channel analysis should comfortably fit within the default quota if responses are cached and you do not repeatedly refetch the same channel.

Official quota overview:
https://developers.google.com/youtube/v3/getting-started

---

# 5. Exact YouTube API flow

For MVP simplicity, support these channel URL formats first:

```text
https://youtube.com/@creatorhandle
https://www.youtube.com/@creatorhandle
https://youtube.com/channel/UCxxxxxxxx
```

If the user enters an unsupported legacy URL format, show a friendly message asking for the channel's current `@handle` URL.

## Step A. Resolve channel

For a handle such as `@GoogleDevelopers`, call:

```http
GET https://www.googleapis.com/youtube/v3/channels
  ?part=snippet,statistics,contentDetails
  &forHandle=@GoogleDevelopers
  &key=YOUTUBE_API_KEY
```

`channels.list` officially supports `forHandle`.

Docs:
https://developers.google.com/youtube/v3/docs/channels/list

Store:

```ts
type ChannelSnapshot = {
  channelId: string
  handle: string
  title: string
  description: string
  thumbnailUrl: string
  subscriberCount: number
  totalViewCount: number
  publicVideoCount: number
  uploadsPlaylistId: string
}
```

The upload playlist ID comes from:

```text
contentDetails.relatedPlaylists.uploads
```

## Step B. Get recent uploads

Call `playlistItems.list` using the upload playlist ID.

```http
GET https://www.googleapis.com/youtube/v3/playlistItems
  ?part=snippet,contentDetails
  &playlistId=UPLOADS_PLAYLIST_ID
  &maxResults=50
  &key=YOUTUBE_API_KEY
```

Docs:
https://developers.google.com/youtube/v3/docs/playlistItems/list

Extract the video IDs.

## Step C. Get detailed statistics for those videos

Batch up to the supported number of video IDs per call and request:

```http
GET https://www.googleapis.com/youtube/v3/videos
  ?part=snippet,statistics,contentDetails
  &id=VIDEO_ID_1,VIDEO_ID_2,...
  &key=YOUTUBE_API_KEY
```

Docs:
https://developers.google.com/youtube/v3/docs/videos/list

Store for each video:

```ts
type VideoSnapshot = {
  videoId: string
  title: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  viewCount: number
  likeCount: number | null
}
```

## Step D. Filter out Shorts for the first forecast

A simple MVP heuristic is enough.

For example:

1. Exclude videos shorter than 60 to 90 seconds.
2. Optionally exclude titles containing obvious `#shorts` patterns.
3. Keep the latest 20 to 30 normal long form videos.

This does not need to be perfect for the hackathon.

## Step E. Derive creator metrics

Calculate:

```text
Subscriber count
Total channel views
Median views across last 20 long form videos
Average views across last 20 long form videos
25th percentile views
75th percentile views
Highest performing recent video
Upload frequency
Median likes
Estimated revenue at selected RPM
```

Do this in your code, not with the LLM.

---

# 6. Creator page and channel analysis

Route:

```text
/creator
```

## Initial state

```text
Grow beyond your normal production budget.

Paste your YouTube channel
[youtube.com/@johntravels                    ]

[Analyze channel]
```

## Loading experience

Make this visually interesting.

```text
Finding channel...
Analyzing 30 recent videos...
Calculating performance range...
Building funding forecast...
```

The individual API calls can happen quickly, but staggered UI progress can make the analysis feel intentional.

## Result state

Example:

```text
John Travels
75.2K subscribers

Recent performance
Median views            184K
Average views           231K
Top recent video        812K
Uploads analyzed        30

Estimated creator economics
Assumed RPM             $4.00 [edit]
Median video revenue    $736
High case revenue       $3,248
```

Then show a simulator.

---

# 7. Funding simulator

This is the first major wow moment.

Inputs:

```text
Project budget       $4,000
Revenue share        20%
Share period         12 months
Assumed RPM          $4.00
```

Output:

```text
Based on your recent channel performance

Expected views
184K to 812K

Estimated video revenue
$736 to $3,248

Estimated amount shared with backers
$147 to $650

Creator keeps from direct YouTube revenue
$589 to $2,598

Production funding received upfront
$4,000
```

Then add a separate visual section:

```text
Additional creator upside

100% of subscriber growth retained
100% of future sponsor value retained
100% of future channel growth retained
100% of secondary content exposure retained
```

Do not try to turn TikTok exposure into fake dollar precision. Keep it as qualitative upside.

CTA:

```text
[Start proposal]
```

---

# 8. Forecast logic for MVP

Do not claim the AI can precisely predict virality.

Use a deterministic forecast first.

Example:

```ts
lowViews = percentile25(recentLongFormViewCounts)
baseViews = median(recentLongFormViewCounts)
highViews = percentile75(recentLongFormViewCounts)
```

Later, when the proposal idea exists, add similarity weighting.

Example:

```text
Creator proposes: Ireland documentary

Recent videos:
Ireland road trip             410K
Scotland train documentary    330K
London budget challenge       120K
Camera review                  62K
```

An LLM can classify which historical videos are semantically similar to the new concept. Your code then weights the similar videos more heavily.

For example:

```ts
forecastBase =
  0.65 * median(similarVideoViews) +
  0.35 * median(allRecentVideoViews)
```

Then create a range around that base.

The LLM should help identify comparable videos and explain the forecast. Your code should calculate the final numbers.

---

# 9. Proposal creation flow

Route:

```text
/creator/new
```

The user starts with minimal input.

## Input 1. Video idea

```text
What do you want to make?

[I want to travel around rural Ireland for one week and make a
30 minute documentary about towns losing their younger population.]
```

## Input 2. Rough production budget

```text
How much do you think you need?

[$4,000]
```

Button:

```text
[Build my proposal]
```

## AI output

Call the model and request structured JSON.

Suggested output schema:

```json
{
  "title": "Ireland's Disappearing Towns",
  "summary": "A 30 minute documentary...",
  "fundingTarget": 4000,
  "recommendedRevenueSharePercent": 20,
  "revenueShareMonths": 12,
  "budget": [
    { "label": "Travel", "amount": 900 },
    { "label": "Accommodation", "amount": 800 },
    { "label": "Local transport", "amount": 400 },
    { "label": "Camera operator", "amount": 1100 },
    { "label": "Editing", "amount": 800 }
  ],
  "creatorPitch": "...",
  "risks": ["..."],
  "comparableVideoIds": ["..."]
}
```

Everything on screen should remain editable.

The user should be able to modify:

* Project title
* Description
* Funding target
* Revenue share percentage
* Revenue share duration
* Budget categories
* Thumbnail or cover image

Then show forecast economics again using the final values.

CTA:

```text
[Publish proposal]
```

---

# 10. Supabase setup

Create a Supabase project.

Environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Because this hackathon MVP has no auth, keep database writes server side through Next.js route handlers or server actions.

Do not expose the service role key to the browser.

## Minimal schema

```sql
create table creator_profiles (
  id uuid primary key default gen_random_uuid(),
  youtube_channel_id text not null,
  youtube_handle text,
  channel_title text not null,
  thumbnail_url text,
  subscriber_count bigint,
  total_view_count bigint,
  public_video_count integer,
  assumed_rpm numeric default 4,
  created_at timestamptz default now()
);

create table proposals (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid references creator_profiles(id),
  title text not null,
  description text,
  cover_image_url text,
  funding_target numeric not null,
  amount_funded numeric default 0,
  revenue_share_percent numeric not null,
  revenue_share_months integer default 12,
  budget jsonb,
  forecast jsonb,
  status text default 'draft',
  created_at timestamptz default now()
);

create table backings (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id),
  backer_name text,
  backer_email text,
  amount numeric not null,
  paypal_order_id text,
  paypal_capture_id text,
  status text default 'pending',
  created_at timestamptz default now()
);

create table published_videos (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id),
  youtube_video_id text,
  published_at timestamptz,
  current_views bigint default 0,
  eligible_revenue numeric default 0,
  updated_at timestamptz default now()
);

create table distributions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id),
  gross_eligible_revenue numeric not null,
  backer_pool_amount numeric not null,
  paypal_batch_id text,
  status text default 'pending',
  created_at timestamptz default now()
);
```

For the MVP, `backer_name` and `backer_email` can be entered in a tiny checkout form or seeded for demo accounts.

---

# 11. Pals marketplace

Route:

```text
/pals
```

Seed 4 to 6 proposals so `/pals` does not look empty.

Example card:

```text
Ireland's Disappearing Towns
John Travels · 75K subscribers

$3,260 of $4,000 funded
████████████████░░ 81%

20% revenue share
12 month term

AI forecast
230K to 720K views

[View project]
```

Each card should make three things obvious:

1. What video will exist?
2. How much needs to be funded?
3. What revenue participation do backers receive?

Do not call the financial field `equity` inside the detailed UI. Use `revenue share` because the backer does not own copyright or ownership in the creator's company.

---

# 12. Pal proposal detail page

Route:

```text
/pals/[id]
```

Suggested structure:

```text
[Creator avatar] John Travels · 75K subscribers

Ireland's Disappearing Towns
A 30 minute documentary...

$3,260 raised of $4,000
81%
137 pals

Pal terms
20% of eligible YouTube revenue
12 months after publication

AI performance estimate
230K to 720K views
$920 to $2,880 estimated revenue

Back $10
Estimated return in forecast range
$0.46 to $1.44

[$10] [$25] [$50] [Custom]

[Back with PayPal]
```

Also show:

* Budget breakdown
* Creator's historical performance
* Comparable previous videos
* AI explanation of forecast
* Clear statement that returns are not guaranteed

---

# 13. PayPal funding integration

For the hackathon, use **PayPal Sandbox**.

Official sandbox guide:
https://developer.paypal.com/sandbox-testing/overview/

PayPal sandbox transactions are mock transactions and do not move live money.

## Get PayPal Sandbox credentials

1. Create or sign in to a PayPal Developer account.
2. Open the Developer Dashboard.
3. Create a Sandbox REST app.
4. Copy the Client ID and Client Secret.
5. Use the sandbox API base URL:

```text
https://api-m.sandbox.paypal.com
```

Official REST API setup:
https://developer.paypal.com/api/get-started/

Environment variables:

```bash
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
```

## MVP PayPal flow

```text
Backer chooses $10
        |
        v
POST /api/paypal/orders
        |
        v
Backend gets PayPal OAuth access token
        |
        v
Backend creates $10 PayPal order
        |
        v
Browser opens PayPal approval
        |
        v
Backer approves Sandbox payment
        |
        v
POST /api/paypal/orders/[id]/capture
        |
        v
Capture succeeds
        |
        v
Create backing row in Supabase
        |
        v
Update amount_funded
```

Do not consider a backing successful merely because the browser says the PayPal popup closed. Confirm success server side from the PayPal capture response.

---

# 14. Creator dashboard after proposals exist

Route:

```text
/creator
```

No login means this can simply show the demo creator's data.

Sections:

```text
Creator overview

Active proposals
Funded projects
Published projects
Revenue to distribute
```

Example project:

```text
Ireland's Disappearing Towns
FUNDED

$4,000 / $4,000
162 pals

[Mark video as published]
```

For demo purposes, `Mark video as published` can open a form asking for a YouTube video URL.

---

# 15. Post publication revenue tracking

For the first MVP, do not block the project on private YouTube revenue API access.

Use one of two modes.

## Demo mode

Have a hidden or clearly labelled demo control:

```text
Simulate 90 days of performance
```

Then populate:

```text
Views                 842,390
Assumed RPM           $4.00
Eligible revenue      $3,369.56
Backer share          20%
Backer pool owed      $673.91
Creator share         $2,695.65
```

This makes the full hackathon story demonstrable immediately.

## Real public mode

If the creator enters the published video URL, call `videos.list` periodically to get the current public view count.

Then estimate revenue using the creator's selected RPM.

Later, replace the estimate with verified revenue after creator OAuth.

---

# 16. Optional YouTube Analytics upgrade

Do this only after the core MVP works.

To access real creator analytics and monetary metrics, use the **YouTube Analytics API**.

Official API reference:
https://developers.google.com/youtube/analytics/reference

The query endpoint is:

```http
GET https://youtubeanalytics.googleapis.com/v2/reports
```

Relevant OAuth scopes:

```text
https://www.googleapis.com/auth/yt-analytics.readonly
https://www.googleapis.com/auth/yt-analytics-monetary.readonly
```

The monetary scope provides access to estimated revenue and ad performance metrics.

Useful metrics include:

```text
views
estimatedRevenue
estimatedAdRevenue
playbackBasedCpm
```

Official metric definitions:
https://developers.google.com/youtube/analytics/metrics

For the hackathon MVP, this is optional because public data plus an editable RPM is enough to demonstrate the product without Google OAuth approval becoming a dependency.

---

# 17. Revenue settlement logic

Important product reality:

YouTube pays the creator outside your platform.

Your platform can calculate that the creator owes backers `$673.91`, but PayPal cannot automatically take 20% of the creator's YouTube payment simply because your app calculated it.

So the MVP settlement flow is:

```text
YouTube or simulated data says video earned $3,369.56
                       |
                       v
Your platform calculates 20%
                       |
                       v
Backer obligation = $673.91
                       |
                       v
Creator clicks
"Distribute $673.91 to backers"
                       |
                       v
PayPal payout is initiated
```

For a real production system, creator agreements, reserves, automated funding accounts, payment permissions, and regulatory requirements would need deeper design.

For the hackathon, manual creator approval is fine and actually makes the payment flow easy to understand.

---

# 18. PayPal Payouts, stretch goal

Official Payouts documentation:
https://developer.paypal.com/payouts/overview/

Official Payouts SDK information:
https://developer.paypal.com/sdk/payouts

Use the Payouts REST API directly from Next.js if you are staying in TypeScript.

The payout algorithm is simple.

Suppose:

```text
Funding target = $4,000
Backer A contributed = $10
Backer pool owed this period = $673.91
```

Backer A funded:

```text
$10 / $4,000 = 0.25% of the campaign
```

Backer A receives:

```text
0.25% * $673.91 = $1.684775
```

Round according to the settlement currency rules before sending the payout.

Create a distribution row before calling PayPal so you have an auditable record of what you intended to send.

---

# 19. API routes to build

Suggested Next.js route handlers:

```text
POST /api/youtube/analyze
  Input: channel URL
  Output: channel + recent videos + derived metrics

POST /api/forecast
  Input: channel metrics + proposal idea + budget + RPM + revenue share
  Output: deterministic forecast + AI explanation

POST /api/proposals
  Create proposal

GET /api/proposals
  Get published proposals

GET /api/proposals/[id]
  Get proposal detail

POST /api/paypal/orders
  Create PayPal Sandbox order

POST /api/paypal/orders/[orderId]/capture
  Capture order and persist backing

POST /api/pals/[id]/simulate-revenue
  Demo only, populate revenue snapshot

POST /api/pals/[id]/distributions
  Calculate distribution ledger

POST /api/paypal/payouts
  Stretch goal, send batch payout
```

---

# 20. Recommended build order

## Phase 1. App shell

Build:

```text
/
/creator
/pals
/pals/[id]
```

Keep `/` extremely basic. Spend the design effort on `/creator` and `/pals`.

Use hardcoded data first.

Goal: establish the two product modes and visual language before integrations.

## Phase 2. Real YouTube channel analysis

Build `/api/youtube/analyze`, called from `/creator`.

Support `@handle` and `/channel/ID` URLs.

Return:

```json
{
  "channel": {},
  "videos": [],
  "metrics": {
    "medianViews": 184000,
    "averageViews": 231000,
    "p25Views": 110000,
    "p75Views": 420000
  }
}
```

Render the result directly inside `/creator`.

This should be the first working wow moment.

## Phase 3. Funding simulator

Add editable:

```text
Budget
Revenue share percentage
RPM
Revenue share duration
```

Calculate the full economics instantly on the client or server.

Do not use AI yet.

## Phase 4. AI proposal generator

Add video idea text area.

Send creator history plus the idea to the model.

Return structured proposal fields and comparable video selection.

Make all generated fields editable.

## Phase 5. Supabase persistence

Create the minimal tables.

Publish proposal into Supabase.

Load proposals from Supabase on `/pals`.

No auth.

## Phase 6. Pals marketplace

Build polished cards and proposal detail page.

Seed additional proposals so the marketplace looks active.

## Phase 7. Real PayPal Sandbox funding

Implement order creation and capture.

After capture:

1. Save backing.
2. Increment funded amount.
3. Show success state.
4. Update proposal funding progress immediately.

This should be the second major wow moment.

## Phase 8. Creator post funding dashboard

Show the newly funded proposal in `/creator`.

Add a funded state and a `Mark published` action.

## Phase 9. Revenue simulation

Add demo performance data.

Show:

```text
Views
Revenue
Backer pool
Creator share
Amount owed
```

Add the button:

```text
[Distribute $673.91 to backers]
```

## Phase 10. PayPal Payouts

If Payouts Sandbox integration is available and stable, send actual mock payouts to Sandbox recipients.

If this becomes a time sink, keep the distribution ledger fully functional and show the intended PayPal payout call in the architecture and demo documentation. Funding checkout is the higher priority real integration.

## Phase 11. Polish

Add:

* Loading states
* Empty states
* Animated funding progress
* Creator performance chart
* Similar video cards
* Backer return calculator
* Clear PayPal transaction success state
* Demo seed controls

---

# 21. Demo data strategy

Use a combination of real and seeded data.

## Real

* YouTube public channel data
* Recent video titles
* View counts
* Channel subscriber count
* PayPal Sandbox funding transaction

## Derived

* Median views
* Percentile forecast
* Estimated revenue from editable RPM
* Backer return calculation

## Seeded or simulated

* Historical private revenue if needed
* Future video performance
* 90 day revenue trajectory
* Multiple marketplace campaigns
* Previous backers

This is honest and gives you a complete end to end demo without waiting months for an actual video to earn money.

---

# 22. Three minute demo flow

## 0:00 to 0:20

Open creator mode.

```text
Fans can invest in YouTube videos.
```

Explain that creators often have a bigger video idea than their normal production budget allows.

## 0:20 to 0:45

Paste a real YouTube channel.

Click **Analyze channel**.

Show real public performance data and estimated economics.

## 0:45 to 1:10

Enter:

```text
I want to make a documentary across rural Ireland.
Budget: $4,000
```

AI builds the proposal, budget, suggested 20% revenue share, and performance forecast.

Publish it.

## 1:10 to 1:45

Switch to `/pals`.

Open the newly published campaign.

Back it with `$10` through PayPal Sandbox.

Return to the campaign and show funding progress increasing.

## 1:45 to 2:15

Switch to a seeded project that has already been funded and published.

Show:

```text
842,390 views
$3,369.56 eligible revenue
20% backer share
$673.91 owed
```

## 2:15 to 2:40

Click:

```text
Distribute $673.91 to backers
```

Show the payout ledger and PayPal Sandbox payout if implemented.

## 2:40 to 3:00

Open `/pals/portfolio`.

Show a `$10` backer receiving their share.

Close with:

```text
Creators get the capital to take bigger creative risks.
Fans get to participate in the success of the videos they help make.
PayPal moves the money in and out.
AI turns creator history into a fundable proposal and understandable forecast.
```

---

# 23. What makes this hackathon submission technically credible

The project is not just a static crowdfunding mockup.

It demonstrates:

1. Real external creator data ingestion through YouTube Data API.
2. Quantitative forecasting based on historical creator performance.
3. AI assisted campaign underwriting and proposal generation.
4. Persistent two sided marketplace data.
5. Real PayPal Sandbox checkout.
6. Backer ownership accounting for the revenue pool.
7. Post publication revenue tracking or simulation.
8. Revenue distribution calculation.
9. PayPal Payouts as the final settlement rail, if completed.

The important story is not that the infrastructure is exotic. The important story is that the prototype demonstrates a financial interaction that does not normally exist today.

---

# 24. What not to build for the MVP

Do not spend time on:

* Authentication
* Creator identity verification
* Comments
* Messaging
* Following creators
* Social feed
* Notifications
* Mobile apps
* Secondary trading
* Selling a backer's stake
* Creator subscriptions
* TikTok API integrations
* Instagram integrations
* Facebook integrations
* Sponsor revenue attribution
* Real legal contracts
* Real securities compliance flows
* Complex automated escrow
* Production grade accounting

The MVP should prove exactly one loop:

```text
Creator has an ambitious video idea
        |
AI + YouTube data turn it into a proposal
        |
Fans fund it with PayPal
        |
Video succeeds or fails
        |
Revenue share is calculated
        |
Backers receive their share
```

---

# 25. Environment variables

A practical `.env.local` might look like:

```bash
# YouTube
YOUTUBE_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# AI
OPENAI_API_KEY=

# PayPal Sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
PAYPAL_CLIENT_SECRET
YOUTUBE_API_KEY
```

through a `NEXT_PUBLIC_` variable.

---

# 26. First task to implement

Start with only the `/creator` vertical slice:

```text
/creator
      |
Paste youtube.com/@handle
      |
POST /api/youtube/analyze
      |
channels.list
      |
uploads playlist
      |
playlistItems.list
      |
videos.list
      |
calculate median / p25 / p75
      |
render creator performance dashboard
      |
editable RPM
      |
show funding simulator
      |
[Start proposal]
```

Do not touch the homepage design, PayPal, Supabase persistence, or AI proposal generation until this `/creator` experience works and looks convincing.

Once `/creator` works, build in this order:

```text
1. /creator/new
2. Supabase proposal persistence
3. /pals marketplace
4. /pals/[id] proposal detail
5. PayPal Sandbox backing
6. /creator project management
7. Revenue simulation
8. /pals/portfolio
9. PayPal Payouts stretch goal
```

---

# Official references

YouTube Data API overview:
https://developers.google.com/youtube/v3/getting-started

YouTube JavaScript quickstart and credential setup:
https://developers.google.com/youtube/v3/quickstart/js

YouTube `channels.list`:
https://developers.google.com/youtube/v3/docs/channels/list

YouTube `playlistItems.list`:
https://developers.google.com/youtube/v3/docs/playlistItems/list

YouTube `videos.list`:
https://developers.google.com/youtube/v3/docs/videos/list

YouTube Analytics API:
https://developers.google.com/youtube/analytics/reference

YouTube Analytics metrics:
https://developers.google.com/youtube/analytics/metrics

PayPal Sandbox:
https://developer.paypal.com/sandbox-testing/overview/

PayPal REST API setup:
https://developer.paypal.com/api/get-started/

PayPal API request authentication:
https://developer.paypal.com/api/make-api-requests

PayPal platform setup:
https://developer.paypal.com/platforms/get-started

PayPal Payouts:
https://developer.paypal.com/payouts/overview/
