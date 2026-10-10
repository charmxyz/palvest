export type ChannelSnapshot = {
  channelId: string;
  handle: string | null;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  subscriberCount: number;
  totalViewCount: number;
  publicVideoCount: number;
  uploadsPlaylistId: string;
};

export type VideoSnapshot = {
  videoId: string;
  title: string;
  description?: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  duration: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number | null;
};

export type ChannelMetrics = {
  sampleSize: number;
  uploadsAnalyzed: number;
  medianViews: number;
  averageViews: number;
  p25Views: number;
  p75Views: number;
  topVideo: { videoId: string; title: string; viewCount: number } | null;
  uploadsPerMonth: number;
  medianLikes: number | null;
};

export type CreatorProfile = {
  id: string;
  youtubeChannelId: string;
  youtubeHandle: string | null;
  channelTitle: string;
  description: string | null;
  thumbnailUrl: string | null;
  subscriberCount: number;
  totalViewCount: number;
  publicVideoCount: number;
  assumedRpm: number;
  videos: VideoSnapshot[];
  metrics: ChannelMetrics;
  analyzedAt: string;
  isSeed: boolean;
};

export type BudgetItem = { label: string; amount: number };

export type ProposalStatus = "draft" | "funding" | "funded" | "published";

export type ForecastRange = { low: number; base: number; high: number };

export type ProposalForecast = {
  method: "percentile" | "similarity";
  rpm: number;
  views: ForecastRange;
  revenue: ForecastRange;
  palPool: ForecastRange;
  creatorKeeps: ForecastRange;
  comparableVideoIds: string[];
  explanation: string | null;
};

export type Proposal = {
  id: string;
  creatorProfileId: string;
  title: string;
  description: string | null;
  creatorPitch: string | null;
  coverImageUrl: string | null;
  fundingTarget: number;
  amountFunded: number;
  revenueSharePercent: number;
  revenueShareMonths: number;
  budget: BudgetItem[];
  forecast: ProposalForecast;
  risks: string[];
  status: ProposalStatus;
  publishedAt: string | null;
  createdAt: string;
  palCount: number;
};

export type ProposalWithCreator = Proposal & {
  creator: Pick<
    CreatorProfile,
    | "id"
    | "channelTitle"
    | "youtubeHandle"
    | "thumbnailUrl"
    | "subscriberCount"
    | "assumedRpm"
  >;
};

export type Backing = {
  id: string;
  proposalId: string;
  backerName: string | null;
  backerEmail: string | null;
  amount: number;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  status: "pending" | "completed" | "failed";
  createdAt: string;
};

export type TrajectoryPoint = { day: number; views: number };

export type PublishedVideo = {
  id: string;
  proposalId: string;
  youtubeVideoId: string | null;
  title: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  currentViews: number;
  assumedRpm: number;
  eligibleRevenue: number;
  source: "simulated" | "youtube" | "none";
  trajectory: TrajectoryPoint[];
  updatedAt: string;
};

export type DistributionStatus =
  | "awaiting_funding"
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "ledger_only";

export type DistributionItem = {
  id: string;
  distributionId: string;
  backerEmail: string;
  backerName: string | null;
  contributed: number;
  amount: number;
  paypalItemId: string | null;
  transactionStatus: string | null;
};

export type Distribution = {
  id: string;
  proposalId: string;
  grossEligibleRevenue: number;
  backerPoolAmount: number;
  paypalBatchId: string | null;
  fundingOrderId: string | null;
  fundingCaptureId: string | null;
  status: DistributionStatus;
  error: string | null;
  createdAt: string;
  items: DistributionItem[];
};
