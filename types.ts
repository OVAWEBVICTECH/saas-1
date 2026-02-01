
export enum NavPage {
  DASHBOARD = 'dashboard',
  GENERATE = 'generate',
  STUDIO_DESIGN = 'studio_design',
  STUDIO_IDEATION = 'studio_ideation',
  STUDIO_INTELLIGENCE = 'studio_intelligence',
  STUDIO_ANALYTICS = 'studio_analytics',
  CHANNELS = 'channels',
  HISTORY = 'history',
  SETTINGS = 'settings',
  SCHEDULE = 'schedule'
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
  graphicHeadline: string;
  hashtags: string[];
  status: 'draft' | 'posting' | 'posted' | 'failed' | 'scheduled';
  deploymentStage?: 'handshake' | 'upload' | 'propagate' | 'verify';
  timestamp?: string;
  suggestedTime?: string;
  scheduledTime?: string;
  scheduledDay?: string;
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
  isAutoPilot?: boolean;
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
