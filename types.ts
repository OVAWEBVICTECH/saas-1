
export enum NavPage {
  DASHBOARD = 'dashboard',
  GENERATE = 'generate',
  CHANNELS = 'channels',
  HISTORY = 'history',
  SETTINGS = 'settings'
}

export interface SocialAccount {
  platformId: string;
  handle: string;
  profileName: string;
  avatarUrl?: string;
  followers: string;
  tokenStatus: 'active' | 'expiring' | 'revoked';
  connectedAt: string;
}

export interface SocialPlatform {
  id: 'linkedin' | 'facebook' | 'instagram' | 'threads' | 'twitter';
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  handle?: string;
}

export interface DesignConfig {
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
  logoX: number; // 0-100 percentage
  logoY: number; // 0-100 percentage
  logoSize: number;
  textPosition: 'top' | 'center' | 'bottom' | 'custom';
  textX: number; // 0-100 percentage
  textY: number; // 0-100 percentage
  textSize: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface SocialPost {
  platformId: string;
  content: string;
  graphicHeadline: string; // New: Short punchy text for image overlay
  hashtags: string[];
  status: 'draft' | 'posting' | 'posted' | 'failed' | 'scheduled';
  deploymentStage?: 'handshake' | 'upload' | 'propagate' | 'verify';
  timestamp?: string;
  suggestedTime?: string;
  scheduledTime?: string;
  visualUrl?: string;
  visualPrompt?: string;
  liveUrl?: string;
  designConfig: DesignConfig;
}

export interface GenerationResult {
  companyName: string;
  tagline: string;
  brandVoice?: string;
  targetAudience?: string;
  posts: SocialPost[];
  sources?: ResearchSource[];
  researchSummary?: string;
}

export interface ResearchSource {
  uri: string;
  title: string;
}

export interface AnalyticsReport {
  chartData: { name: string; value: number }[];
  summary: string;
  keyTakeaways: string[];
}

export interface SocialAnalytics {
  reach: number;
  engagement: number;
  clicks: number;
}

export interface ContentIdea {
  title: string;
  description: string;
  tags: string[];
}
