// Demo seed: fictional creators with synthetic upload history, a live marketplace,
// one funded+published project ready to distribute (the demo's $673.91 moment),
// and one project already paid out so the Pal portfolio shows earnings.
import type postgres from "postgres";
import { SCHEMA_SQL } from "./schema";
import {
  backerPoolOwed,
  buildForecast,
  deriveMetrics,
  metricsSample,
  revenueFor,
  round2,
  simulateTrajectory,
  splitPool,
} from "./finance";
import type { BudgetItem, VideoSnapshot } from "./types";

export const DEMO_PAL = { name: "Alex Rivera", email: "alex.rivera@pals.demo" };

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DAY = 86_400_000;

type SeedCreator = {
  key: string;
  channelId: string;
  handle: string;
  title: string;
  description: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  rpm: number;
  medianViews: number;
  /** [title, multiplier on median, topic tag] */
  videos: [string, number, string?][];
};

const CREATORS: SeedCreator[] = [
  {
    key: "nomad",
    channelId: "UCseedNomadNotes00000001",
    handle: "@nomad-notes",
    title: "Nomad Notes",
    description: "Slow travel documentaries from places most people skip.",
    subscribers: 412_000,
    totalViews: 61_400_000,
    videoCount: 214,
    rpm: 4,
    medianViews: 290_000,
    videos: [
      ["I Took the Slowest Train in Scotland", 1.3, "rail"],
      ["Living on $10 a Day in Georgia", 1.0],
      ["Albania's Empty Beaches in Winter", 0.8],
      ["The Last Overnight Ferry to the Faroe Islands", 1.6, "remote"],
      ["Budget Week in Lisbon (Honest Costs)", 0.6],
      ["Inside Kazakhstan's Abandoned Space City", 2.4, "remote"],
      ["Night Bus Across Turkey", 0.9, "rail"],
      ["Why Nobody Visits Moldova", 1.1],
      ["48 Hours in Tbilisi's Old Town", 0.7],
      ["Riding Norway's Most Remote Railway", 1.8, "rail"],
      ["Camera Gear I Actually Use", 0.3],
      ["Hitchhiking the Pamir Highway", 2.1, "remote"],
      ["A Week in a Mongolian Ger Camp", 1.5, "remote"],
      ["Copenhagen on a Budget", 0.5],
      ["The World's Longest Tram Line", 0.9, "rail"],
      ["Q&A: How I Fund My Travel Films", 0.35],
      ["Village Life in Northern Romania", 1.0],
      ["Crossing the Caspian Sea by Cargo Ship", 2.8, "remote"],
      ["Sleeper Train From Vienna to Venice", 1.2, "rail"],
      ["Iceland's Westfjords in a Campervan", 0.95],
      ["Why I Quit Fast Travel", 0.45],
      ["Uzbekistan's Silk Road Cities", 1.25],
      ["Cheapest Countries in Europe 2026", 0.7],
      ["Inside a Siberian Winter Village", 2.0, "remote"],
    ],
  },
  {
    key: "kitchen",
    channelId: "UCseedKitchenLab00000002",
    handle: "@kitchen-lab",
    title: "Kitchen Lab",
    description: "Food history, recreated one recipe at a time.",
    subscribers: 238_000,
    totalViews: 29_800_000,
    videoCount: 156,
    rpm: 5,
    medianViews: 165_000,
    videos: [
      ["Cooking a Roman Legionary's Daily Ration", 1.7, "history"],
      ["Testing 5 Viral Pasta Hacks", 0.8],
      ["The Original 1896 Fannie Farmer Brownie", 1.4, "history"],
      ["Mexico City Taco Crawl", 1.9, "street"],
      ["Sharpening Knives the Old Way", 0.5],
      ["What Sailors Ate in 1805", 2.2, "history"],
      ["$1 Breakfast vs $100 Breakfast", 1.1],
      ["Making Mole From Scratch (12 Hours)", 1.6, "street"],
      ["Victorian Christmas Pudding", 1.2, "history"],
      ["My Kitchen Tour", 0.3],
      ["Bangkok Night Market Challenge", 1.5, "street"],
      ["Medieval Bread, Three Ways", 0.9, "history"],
      ["Fermenting Everything for 30 Days", 0.7],
      ["Lunch in a 1950s Diner", 1.0, "history"],
      ["Testing Grandma Recipes From Viewers", 0.6],
      ["Istanbul Street Food at 3am", 1.3, "street"],
      ["Why French Omelettes Are Hard", 0.55],
      ["Cooking From a 1700s Cookbook", 1.8, "history"],
      ["The Perfect Tortilla", 0.75, "street"],
      ["Feeding a Family for $20", 0.65],
      ["Oaxaca Market Breakfast", 1.35, "street"],
      ["Ancient Egyptian Beer Experiment", 2.5, "history"],
    ],
  },
  {
    key: "byte",
    channelId: "UCseedByteSized00000003",
    handle: "@byte-sized",
    title: "Byte Sized",
    description: "Hardware builds, homelabs and computers from junk.",
    subscribers: 1_100_000,
    totalViews: 188_000_000,
    videoCount: 341,
    rpm: 7,
    medianViews: 520_000,
    videos: [
      ["I Built a NAS From a Broken Laptop", 1.6, "build"],
      ["The $50 Gaming PC Challenge", 2.2, "build"],
      ["Reviewing the Worst Keyboard on Amazon", 0.7],
      ["Homelab Tour 2026", 1.0, "build"],
      ["Why Your Router Is Slow", 0.6],
      ["Water Cooling a Raspberry Pi Cluster", 1.8, "build"],
      ["Fixing E-Waste PCs From the Dump", 2.6, "build"],
      ["Monitor Buying Guide", 0.45],
      ["Running AI on a 10-Year-Old GPU", 1.4],
      ["The Quietest PC I've Ever Built", 1.1, "build"],
      ["Desk Setup Update", 0.35],
      ["Rack Mounting Everything", 1.3, "build"],
      ["Linux for Gamers: 30 Days", 1.0],
      ["Restoring a 1998 Workstation", 1.5, "build"],
      ["Cheapest 10Gb Network Possible", 0.9, "build"],
      ["Mechanical Keyboard Sound Test", 0.5],
      ["Server From a Dumpster: Part 2", 2.0, "build"],
      ["Building a PC Inside a Fridge", 1.7, "build"],
      ["Smartphone vs Laptop CPU", 0.8],
      ["Tiny PCs Ranked", 0.75],
    ],
  },
  {
    key: "trail",
    channelId: "UCseedTrailAndError00004",
    handle: "@trail-and-error",
    title: "Trail & Error",
    description: "Wilderness trips, gear that fails, and lessons learned.",
    subscribers: 96_000,
    totalViews: 9_100_000,
    videoCount: 88,
    rpm: 4.5,
    medianViews: 72_000,
    videos: [
      ["Three Nights in a Snow Cave", 1.9, "cold"],
      ["Ultralight Pack Shakedown", 0.6],
      ["Lost in the Fog on Ben Nevis", 1.4],
      ["Hot Tent Camping at -25°", 2.1, "cold"],
      ["Gear That Failed Me This Year", 0.9],
      ["Packrafting the Yukon", 1.6],
      ["Winter Bushcraft Shelter Build", 1.3, "cold"],
      ["My First Solo Thru-Hike", 1.0],
      ["Cheap vs Expensive Sleeping Bags", 0.7, "cold"],
      ["Storm Night in the Highlands", 1.2],
      ["Q&A at Camp", 0.35],
      ["Frozen Lake Ice Fishing Overnight", 1.5, "cold"],
      ["Trail Food Taste Test", 0.55],
      ["Arctic Circle by Ski", 1.8, "cold"],
      ["Wild Camping Etiquette", 0.5],
      ["Sea Kayak Camping in Norway", 1.1],
      ["Canoe Trip Gone Wrong", 1.4],
      ["Igloo Build With My Dad", 1.0, "cold"],
    ],
  },
];

function buildVideos(c: SeedCreator, rand: () => number, now: number): VideoSnapshot[] {
  const spacing = 30.44 / 3.2; // ~3 uploads a month
  return c.videos.map(([title, mult], i) => {
    const ageDays = 9 + i * spacing + rand() * 3;
    const noise = 0.85 + rand() * 0.3;
    const views = Math.round(c.medianViews * mult * noise);
    const durationSeconds = 600 + Math.round(rand() * 1800);
    return {
      videoId: `${c.key.slice(0, 4)}${String(i).padStart(3, "0")}seed`.slice(0, 11),
      title,
      publishedAt: new Date(now - ageDays * DAY).toISOString(),
      thumbnailUrl: null,
      duration: `PT${Math.floor(durationSeconds / 60)}M${durationSeconds % 60}S`,
      durationSeconds,
      viewCount: views,
      likeCount: Math.round(views * (0.028 + rand() * 0.02)),
    };
  });
}

type SeedProposal = {
  creator: string;
  title: string;
  description: string;
  pitch: string;
  cover: string;
  target: number;
  funded: number;
  share: number;
  months: number;
  topic: string;
  budget: BudgetItem[];
  risks: string[];
  explanation: string;
  daysAgo: number;
  demoPalAmount?: number;
  published?: { daysAgo: number; views: number; distributed?: boolean };
};

const PROPOSALS: SeedProposal[] = [
  {
    creator: "nomad",
    title: "48 Hours on the Trans-Siberian Railway",
    description:
      "A 35-minute documentary riding the full Moscow-to-Vladivostok line in third class, told through the people who live in the carriages for a week.",
    pitch:
      "My rail films are my best performers. This one needs a second camera operator and a fixer who speaks Russian — that's the budget I can't cover from ad revenue alone.",
    cover: "gradient:2",
    target: 4000,
    funded: 4000,
    share: 20,
    months: 12,
    topic: "rail",
    budget: [
      { label: "Rail tickets & visas", amount: 1100 },
      { label: "Camera operator", amount: 1300 },
      { label: "Local fixer & translation", amount: 700 },
      { label: "Editing & color", amount: 900 },
    ],
    risks: [
      "Filming permissions on trains can change at short notice.",
      "Winter delays may extend the shoot by several days.",
    ],
    explanation:
      "Weighted toward Nomad Notes' rail and long-journey films, which outperform the channel median by roughly 30%.",
    daysAgo: 140,
    demoPalAmount: 10,
    published: { daysAgo: 95, views: 842_390 },
  },
  {
    creator: "nomad",
    title: "Crossing Mongolia on Horseback",
    description:
      "Twelve days riding west to east with a nomadic herding family, filmed as a feature-length episode.",
    pitch:
      "Remote-places videos are where my channel grows fastest. Horses, guides and satellite comms are the costs I need help with.",
    cover: "gradient:0",
    target: 8000,
    funded: 6480,
    share: 20,
    months: 12,
    topic: "remote",
    budget: [
      { label: "Guides & horses", amount: 2600 },
      { label: "Flights & permits", amount: 1700 },
      { label: "Satellite comms & safety", amount: 900 },
      { label: "Camera operator", amount: 1600 },
      { label: "Editing", amount: 1200 },
    ],
    risks: [
      "Weather can cut the route short.",
      "Remote filming increases the chance of equipment loss.",
    ],
    explanation:
      "Comparable remote-region films average well above the channel median, so the forecast leans higher than a typical upload.",
    daysAgo: 6,
  },
  {
    creator: "kitchen",
    title: "Recreating a 1920s Paris Bistro Menu",
    description:
      "A full five-course menu cooked from a 1924 bistro's handwritten notebook, with a historian at the table.",
    pitch:
      "History recipes are my strongest format. Funding covers the rare ingredients, a period-accurate set and a food historian's time.",
    cover: "gradient:4",
    target: 3500,
    funded: 2150,
    share: 15,
    months: 12,
    topic: "history",
    budget: [
      { label: "Ingredients & sourcing", amount: 900 },
      { label: "Set & props", amount: 1000 },
      { label: "Historian consultation", amount: 600 },
      { label: "Editing", amount: 1000 },
    ],
    risks: ["Some ingredients may need substitutions if unavailable."],
    explanation:
      "History-recipe uploads are Kitchen Lab's top quartile; weighting them lifts the base case above the channel median.",
    daysAgo: 4,
  },
  {
    creator: "kitchen",
    title: "The Street Food Map of Oaxaca",
    description:
      "Seven markets, seven days, one map of every dish worth crossing the city for.",
    pitch: "My Mexico street-food videos keep getting requested. This lets me do it properly.",
    cover: "gradient:5",
    target: 3000,
    funded: 3000,
    share: 18,
    months: 12,
    topic: "street",
    budget: [
      { label: "Travel", amount: 1100 },
      { label: "Local producer", amount: 900 },
      { label: "Editing & graphics", amount: 1000 },
    ],
    risks: ["Market access depends on local vendors' consent to film."],
    explanation: "Street-food episodes consistently land in the channel's upper range.",
    daysAgo: 190,
    demoPalAmount: 25,
    published: { daysAgo: 140, views: 1_248_000, distributed: true },
  },
  {
    creator: "byte",
    title: "I Built a Server Rack From E-Waste",
    description:
      "A full 42U homelab built entirely from recycled enterprise hardware rescued from a recycling centre.",
    pitch:
      "My junk-to-hardware builds are my most-watched videos. Shipping, storage and replacement parts are what I need covered.",
    cover: "gradient:1",
    target: 5000,
    funded: 5000,
    share: 12,
    months: 12,
    topic: "build",
    budget: [
      { label: "Hardware & replacement parts", amount: 2200 },
      { label: "Freight & storage", amount: 1100 },
      { label: "Editing", amount: 1200 },
      { label: "Graphics & animation", amount: 500 },
    ],
    risks: ["Recovered hardware may be unrecoverable, extending the build."],
    explanation: "Build videos skew well above Byte Sized's median views.",
    daysAgo: 30,
    demoPalAmount: 50,
  },
  {
    creator: "trail",
    title: "Solo Winter Camping at −40°",
    description:
      "Five nights alone in the Yukon in the coldest week of the year, testing whether a hot tent can keep up.",
    pitch:
      "My cold-weather trips double my normal views. Getting there and staying safe is the expensive part.",
    cover: "gradient:3",
    target: 4500,
    funded: 1215,
    share: 25,
    months: 12,
    topic: "cold",
    budget: [
      { label: "Flights & ground transport", amount: 1400 },
      { label: "Cold-weather gear", amount: 1200 },
      { label: "Safety & satellite comms", amount: 800 },
      { label: "Editing", amount: 1100 },
    ],
    risks: ["Extreme cold may shorten the trip for safety."],
    explanation: "Cold-weather trips average about 1.5× the channel median.",
    daysAgo: 2,
  },
];

const FIRST = [
  "Maya", "Leo", "Priya", "Sam", "Jordan", "Noah", "Ava", "Ethan", "Zara", "Kai",
  "Lena", "Omar", "Ivy", "Theo", "Nia", "Ravi", "Chloe", "Mateo", "Hana", "Finn",
  "Sofia", "Eli", "Amara", "Jonas", "Rosa", "Yusuf", "Mila", "Dev", "Grace", "Luca",
];
const LAST = [
  "Chen", "Patel", "Okafor", "Silva", "Novak", "Kim", "Garcia", "Haddad", "Larsen",
  "Moreau", "Singh", "Tanaka", "Reyes", "Byrne", "Costa", "Ali", "Fischer", "Ito",
];

function seedBackers(total: number, rand: () => number, fixed?: number) {
  const amounts = [5, 10, 10, 10, 15, 20, 25, 25, 25, 50, 50, 100, 100, 250];
  const out: { name: string; email: string; amount: number; daysAgo: number }[] = [];
  let remaining = total;
  if (fixed) {
    out.push({ ...DEMO_PAL, amount: fixed, daysAgo: 1 + rand() * 20 });
    remaining -= fixed;
  }
  while (remaining > 0) {
    let a = amounts[Math.floor(rand() * amounts.length)];
    if (a > remaining || remaining - a < 5) a = remaining;
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    const n = Math.floor(rand() * 900);
    out.push({
      name: `${first} ${last}`,
      email: `${first}.${last}${n}@pals.demo`.toLowerCase(),
      amount: a,
      daysAgo: rand() * 30,
    });
    remaining -= a;
  }
  return out;
}

/**
 * Schema changes and the reseed's truncate need exclusive table locks. Fail fast with
 * a clear error if another connection (e.g. a running dev server) holds one, and give
 * the work itself more time than Supabase's default statement timeout.
 */
async function withSetupTimeouts(tx: postgres.TransactionSql) {
  await tx`set local lock_timeout = '15s'`;
  await tx`set local statement_timeout = '5min'`;
  // The truncate blocks every read on the site until this commits; never let it linger.
  await tx`set local idle_in_transaction_session_timeout = '15s'`;
}

export async function setupSchema(sql: postgres.Sql) {
  await sql.begin(async (tx) => {
    await withSetupTimeouts(tx);
    await tx.unsafe(SCHEMA_SQL);
  });
}

export async function seedDatabase(sql: postgres.Sql) {
  const now = Date.now();
  const rand = rng(42);

  await sql.begin(async (tx) => {
    await withSetupTimeouts(tx);
    await tx`truncate distribution_items, distributions, published_videos, backings, proposals, creator_profiles restart identity cascade`;

    const creatorIds = new Map<string, { id: string; videos: VideoSnapshot[]; rpm: number }>();
    for (const [ci, c] of CREATORS.entries()) {
      const videos = buildVideos(c, rand, now);
      const metrics = deriveMetrics(videos, now);
      const [row] = await tx`
        insert into creator_profiles ${tx({
          youtube_channel_id: c.channelId,
          youtube_handle: c.handle,
          channel_title: c.title,
          description: c.description,
          thumbnail_url: null,
          subscriber_count: c.subscribers,
          total_view_count: c.totalViews,
          public_video_count: c.videoCount,
          uploads_playlist_id: null,
          assumed_rpm: c.rpm,
          videos: tx.json(videos),
          metrics: tx.json(metrics),
          is_seed: true,
          analyzed_at: new Date(now - 3 * DAY),
          created_at: new Date(now - 200 * DAY + ci * 60_000),
        })}
        returning id`;
      creatorIds.set(c.key, { id: row.id, videos, rpm: c.rpm });
    }

    for (const p of PROPOSALS) {
      const creator = creatorIds.get(p.creator)!;
      const seedCreator = CREATORS.find((c) => c.key === p.creator)!;
      const sample = metricsSample(creator.videos, now);
      const comparable = creator.videos.filter((v) =>
        seedCreator.videos.find(([t, , topic]) => t === v.title && topic === p.topic),
      );
      const forecast = buildForecast({
        sampleViews: sample.map((v) => v.viewCount),
        comparableViews: comparable.map((v) => v.viewCount),
        comparableVideoIds: comparable.map((v) => v.videoId),
        rpm: creator.rpm,
        sharePercent: p.share,
        explanation: p.explanation,
      });
      const status = p.published ? "published" : p.funded >= p.target ? "funded" : "funding";
      const createdAt = new Date(now - p.daysAgo * DAY);

      const [prop] = await tx`
        insert into proposals ${tx({
          creator_profile_id: creator.id,
          title: p.title,
          description: p.description,
          creator_pitch: p.pitch,
          cover_image_url: p.cover,
          funding_target: p.target,
          amount_funded: p.funded,
          revenue_share_percent: p.share,
          revenue_share_months: p.months,
          budget: tx.json(p.budget),
          forecast: tx.json(forecast),
          risks: tx.json(p.risks),
          status,
          published_at: p.published ? new Date(now - p.published.daysAgo * DAY) : null,
          created_at: createdAt,
        })}
        returning id`;

      const backers = seedBackers(p.funded, rand, p.demoPalAmount);
      await tx`
        insert into backings ${tx(
          backers.map((b, i) => ({
            proposal_id: prop.id,
            backer_name: b.name,
            backer_email: b.email,
            amount: b.amount,
            paypal_order_id: `SEED-${prop.id.slice(0, 8)}-${i}`,
            paypal_capture_id: null,
            status: "completed",
            completed_at: new Date(Math.max(+createdAt, now - b.daysAgo * DAY)),
            created_at: new Date(Math.max(+createdAt, now - b.daysAgo * DAY)),
          })),
        )}`;

      if (p.published) {
        const revenue = round2(revenueFor(p.published.views, creator.rpm));
        await tx`
          insert into published_videos ${tx({
            proposal_id: prop.id,
            youtube_video_id: null,
            title: p.title,
            thumbnail_url: null,
            published_at: new Date(now - p.published.daysAgo * DAY),
            current_views: p.published.views,
            assumed_rpm: creator.rpm,
            eligible_revenue: revenue,
            source: "simulated",
            trajectory: tx.json(simulateTrajectory(p.published.views, 90, 7)),
          })}`;

        if (p.published.distributed) {
          const pool = backerPoolOwed(revenue, p.share, p.target, p.funded);
          const byEmail = new Map<string, { email: string; name: string; amount: number }>();
          for (const b of backers) {
            const cur = byEmail.get(b.email);
            if (cur) cur.amount += b.amount;
            else byEmail.set(b.email, { email: b.email, name: b.name, amount: b.amount });
          }
          const [dist] = await tx`
            insert into distributions ${tx({
              proposal_id: prop.id,
              gross_eligible_revenue: revenue,
              backer_pool_amount: pool,
              paypal_batch_id: null,
              status: "success",
              created_at: new Date(now - 20 * DAY),
            })}
            returning id`;
          await tx`
            insert into distribution_items ${tx(
              splitPool(pool, [...byEmail.values()]).map((item) => ({
                distribution_id: dist.id,
                backer_email: item.email,
                backer_name: item.name,
                contributed: item.amount,
                amount: item.payout,
                transaction_status: "SUCCESS",
              })),
            )}`;
        }
      }
    }
  });
}
