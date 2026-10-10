// Hardcoded landing-page scenarios. They mirror the demo seed (src/lib/seed.ts)
// so the story on the homepage matches what you find inside the app.

export const CREATOR_STORY = {
  creator: "Nomad Notes",
  subscribers: 412_000,
  title: "48 Hours on the Trans-Siberian Railway",
  budget: [
    { label: "Rail tickets & visas", amount: 1100 },
    { label: "Camera operator", amount: 1300 },
    { label: "Local fixer & translation", amount: 700 },
    { label: "Editing & color", amount: 900 },
  ],
  target: 4000,
  sharePercent: 20,
  months: 12,
  rpm: 4,
  forecast: { low: 280_000, base: 410_000, high: 560_000 },
  pals: 84,
  views: 842_390,
  /** A few of the 84 ledger lines, largest-remainder split of the $673.91 pool. */
  ledger: [
    { name: "Grace Okafor", amount: 250 },
    { name: "Theo Larsen", amount: 100 },
    { name: "Hana Costa", amount: 50 },
    { name: "Alex Rivera", amount: 10 },
  ],
};

export type PalScenario = {
  id: string;
  title: string;
  creator: string;
  cover: string;
  target: number;
  funded: number;
  sharePercent: number;
  months: number;
  rpm: number;
  views: { low: number; base: number; high: number };
};

export const PAL_SCENARIOS: PalScenario[] = [
  {
    id: "mongolia",
    title: "Crossing Mongolia on Horseback",
    creator: "Nomad Notes",
    cover: "gradient:0",
    target: 8000,
    funded: 6480,
    sharePercent: 20,
    months: 12,
    rpm: 4,
    views: { low: 350_000, base: 490_000, high: 670_000 },
  },
  {
    id: "bistro",
    title: "Recreating a 1920s Paris Bistro Menu",
    creator: "Kitchen Lab",
    cover: "gradient:4",
    target: 3500,
    funded: 2150,
    sharePercent: 15,
    months: 12,
    rpm: 5,
    views: { low: 180_000, base: 250_000, high: 330_000 },
  },
  {
    id: "yukon",
    title: "Solo Winter Camping at −40°",
    creator: "Trail & Error",
    cover: "gradient:3",
    target: 4500,
    funded: 1215,
    sharePercent: 25,
    months: 12,
    rpm: 4.5,
    views: { low: 72_000, base: 100_000, high: 135_000 },
  },
];
