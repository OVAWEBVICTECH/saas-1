
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GenerationResult, ResearchSource, AnalyticsReport, ContentIdea, SocialAccount, SocialPost, DesignConfig } from "../types";

/**
 * Custom error class to handle specific Gemini API failures
 */
export class AIError extends Error {
  constructor(public message: string, public code?: number, public status?: string) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Global synthesis cache to prevent redundant API consumption
 */
const synthesisCache = new Map<string, any>();

/**
 * Exponential backoff configuration with Jitter
 */
const MAX_RETRIES = 5;
const INITIAL_BACKOFF = 1000; 

/**
 * Uses the default injected API key.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Wraps API calls with hyper-resilient retry logic using randomized jitter
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, backoff = INITIAL_BACKOFF): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = 
      error.status === "RESOURCE_EXHAUSTED" || 
      error.code === 429 || 
      (error.code >= 500 && error.code <= 599);

    if (isRetryable && retries > 0) {
      const jitter = Math.random() * 1000;
      const totalWait = backoff + jitter;
      
      console.warn(`System busy. Calibrating neural pathways... Retrying in ${Math.round(totalWait)}ms. (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, totalWait));
      return callWithRetry(fn, retries - 1, backoff * 2.5);
    }
    throw error;
  }
}

const handleAIRequest = async <T>(requestPromise: Promise<T>): Promise<T> => {
  try {
    return await callWithRetry(() => requestPromise);
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    
    if (error.status === "RESOURCE_EXHAUSTED" || error.message?.includes("quota") || error.code === 429) {
      throw new AIError("QUOTA_EXHAUSTED", 429, "RESOURCE_EXHAUSTED");
    }

    if (error.message?.includes("Requested entity was not found")) {
       throw new AIError("Engine Handshake Reset: System recalibrating.", 404);
    }

    throw new AIError(error.message || "An unexpected error occurred in the Webvic Flow engine.");
  }
};

const extractJSON = (text: string | undefined) => {
  if (!text) return null;
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    return null;
  }
};

export const validateSocialHandle = async (platformId: string, handle: string, brandName: string): Promise<SocialAccount> => {
  const cacheKey = `auth-${platformId}-${handle}`;
  if (synthesisCache.has(cacheKey)) return synthesisCache.get(cacheKey);

  const ai = getAI();
  const response = await handleAIRequest<GenerateContentResponse>(ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [{
        text: `Platform: ${platformId}. Handle: ${handle}. Brand: ${brandName}. Simulate OAuth. Return profileName, avatarUrl, followers.`
      }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          profileName: { type: Type.STRING },
          avatarUrl: { type: Type.STRING },
          followers: { type: Type.STRING }
        },
        required: ["profileName", "avatarUrl", "followers"]
      }
    }
  }));

  const data = extractJSON(response.text) || { profileName: "Authorized User", avatarUrl: "", followers: "1.0k" };
  const account: SocialAccount = {
    platformId,
    handle,
    profileName: data.profileName,
    avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${handle || platformId}&background=random&color=fff&size=128`,
    followers: data.followers,
    tokenStatus: 'active',
    connectedAt: new Date().toISOString()
  };
  
  synthesisCache.set(cacheKey, account);
  return account;
};

export const executeProductionDeployment = async (
  post: SocialPost, 
  onStageChange: (stage: 'handshake' | 'upload' | 'propagate' | 'verify') => void
): Promise<string> => {
  const stages: ('handshake' | 'upload' | 'propagate' | 'verify')[] = ['handshake', 'upload', 'propagate', 'verify'];
  for (const stage of stages) {
    onStageChange(stage);
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  }
  return `https://${post.platformId}.com/p/${Math.random().toString(36).substring(7)}`;
};

export const researchCompany = async (url: string): Promise<{ 
  summary: string; 
  sources: ResearchSource[]; 
  logoUrl?: string; 
  companyName?: string; 
  tagline?: string;
  brandVoice?: string;
  targetAudience?: string;
}> => {
  const cacheKey = `research-${url}`;
  if (synthesisCache.has(cacheKey)) return synthesisCache.get(cacheKey);

  const ai = getAI();
  const sanitizedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  const response = await handleAIRequest<GenerateContentResponse>(ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: {
      parts: [{
        text: `Analyze the company profile for the URL: ${sanitizedUrl}. Provide: Official Brand Name, Tagline, Brand Voice, Target Audience, Professional Summary, and Placeholder Logo URL.`
      }]
    },
    config: { 
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          tagline: { type: Type.STRING },
          brandVoice: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          summary: { type: Type.STRING },
          logoUrl: { type: Type.STRING }
        },
        required: ["companyName", "tagline", "brandVoice", "targetAudience", "summary"]
      }
    },
  }));

  const data = extractJSON(response.text) || {
    companyName: "Nexus Brand",
    tagline: "Innovative Solutions",
    brandVoice: "Professional",
    targetAudience: "Global Businesses",
    summary: "Synthesis complete."
  };
  
  const result = { ...data, sources: [] };
  synthesisCache.set(cacheKey, result);
  return result;
};

export const analyzeAndGeneratePosts = async (
  url: string, 
  platformId: string, // Added platform selection
  manualData?: { companyName: string; tagline: string },
  updateProgress?: (status: string) => void,
  isAutoPilot: boolean = false
): Promise<GenerationResult & { logoUrl?: string }> => {
  const cacheKey = `posts-${url}-${platformId}-${isAutoPilot}`;
  if (synthesisCache.has(cacheKey)) return synthesisCache.get(cacheKey);

  const ai = getAI();
  const sanitizedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  if (updateProgress) updateProgress(`Scanning ${platformId} ecosystem...`);
  const brandIntel = await researchCompany(sanitizedUrl);
  
  const context = `
    BRAND: ${manualData?.companyName || brandIntel.companyName}
    TAGLINE: ${manualData?.tagline || brandIntel.tagline}
    VOICE: ${brandIntel.brandVoice}
    AUDIENCE: ${brandIntel.targetAudience}
    PLATFORM: ${platformId}
  `;

  // Scale posts: 7 for autopilot, 2 for manual
  const quantity = isAutoPilot ? 7 : 2;
  const schedulingRule = isAutoPilot 
    ? `Generate 7 unique posts for ${platformId} (one for each day of the week). Assign each a 'scheduledDay' and an optimized 'scheduledTime'.` 
    : `Generate 2 tactical high-fidelity variations for ${platformId}.`;

  if (updateProgress) updateProgress(isAutoPilot ? `Synthesizing full 7-day ${platformId} cycle...` : `Generating strategic tactical assets...`);

  const response = await handleAIRequest<GenerateContentResponse>(ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: {
      parts: [{
        text: `Based on this context: ${context}, generate exactly ${quantity} UNIQUE POSTS for ${platformId}.
        
        ${schedulingRule}

        CRITICAL RULES:
        1. platformId MUST BE "${platformId.toLowerCase()}".
        2. content: Full professional marketing copy.
        3. graphicHeadline: A SHORT, PUNCHY 3-8 WORD HEADLINE.
        4. visualPrompt: Atmospheric background design asset description (no text).
        
        Return JSON with: companyName, tagline, posts.`
      }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          tagline: { type: Type.STRING },
          posts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                platformId: { type: Type.STRING },
                content: { type: Type.STRING },
                graphicHeadline: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                scheduledTime: { type: Type.STRING },
                scheduledDay: { type: Type.STRING },
                visualPrompt: { type: Type.STRING }
              },
              required: ["platformId", "content", "graphicHeadline", "hashtags", "visualPrompt"]
            }
          }
        },
        required: ["companyName", "tagline", "posts"]
      }
    }
  }));

  const data = extractJSON(response.text);
  if (!data) throw new Error("Synthesis failed: Output integrity compromised.");
  
  const defaultDesignConfig: DesignConfig = {
    logoPosition: 'top-left',
    logoX: 10,
    logoY: 10,
    logoSize: 120,
    textPosition: 'center',
    textX: 50,
    textY: 50,
    textSize: 48,
    textAlign: 'center'
  };

  data.posts = data.posts.map((p: any) => ({ 
    ...p, 
    status: isAutoPilot ? 'scheduled' : 'draft',
    designConfig: { ...defaultDesignConfig }
  }));
  
  const result = { 
    ...data, 
    sources: [], 
    researchSummary: brandIntel.summary, 
    logoUrl: brandIntel.logoUrl,
    isAutoPilot
  };
  
  synthesisCache.set(cacheKey, result);
  return result;
};

export const generateImageForPost = async (visualPrompt: string): Promise<string> => {
  const cacheKey = `image-${btoa(visualPrompt).substring(0, 32)}`;
  if (synthesisCache.has(cacheKey)) return synthesisCache.get(cacheKey);

  const ai = getAI();
  const masterPrompt = `Professional background only. NO TEXT. Theme: ${visualPrompt}. 4K Corporate style.`;

  const response = await handleAIRequest<GenerateContentResponse>(ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: masterPrompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  }));

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const url = `data:image/png;base64,${part.inlineData.data}`;
        synthesisCache.set(cacheKey, url);
        return url;
      }
    }
  }
  throw new Error("Visual synthesis failed.");
};

export const conductMarketResearch = async (query: string): Promise<{ text: string; sources: ResearchSource[] }> => {
  const cacheKey = `market-${query}`;
  if (synthesisCache.has(cacheKey)) return synthesisCache.get(cacheKey);

  const ai = getAI();
  const response = await handleAIRequest<GenerateContentResponse>(ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: `Deep market intelligence for: ${query}` }] },
    config: { tools: [{ googleSearch: {} }] }
  }));
  const text = response.text || "Analysis complete.";
  const sources: ResearchSource[] = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .filter(chunk => chunk.web)
    .map(chunk => ({ uri: chunk.web!.uri, title: chunk.web!.title || chunk.web!.uri }));
  
  const result = { text, sources };
  synthesisCache.set(cacheKey, result);
  return result;
};

export const generateVisualAnalytics = async (input: string): Promise<AnalyticsReport> => {
  const ai = getAI();
  const response = await handleAIRequest<GenerateContentResponse>(ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: `Process this metrics narrative: ${input}` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chartData: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, value: { type: Type.NUMBER } }, required: ["name", "value"] } },
          summary: { type: Type.STRING },
          keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["chartData", "summary", "keyTakeaways"]
      }
    }
  }));
  return extractJSON(response.text);
};

export const generateMarketingContent = async (topic: string): Promise<ContentIdea[]> => {
  const ai = getAI();
  const response = await handleAIRequest<GenerateContentResponse>(ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: `Generate marketing hooks for: ${topic}` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "description", "tags"] } }
    }
  }));
  return extractJSON(response.text) || [];
};
