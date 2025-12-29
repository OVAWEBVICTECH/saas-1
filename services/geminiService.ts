
import { GoogleGenAI, Type } from "@google/genai";
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
 * Uses the default injected API key.
 * Always create a new instance to ensure up-to-date key access.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const handleAIRequest = async <T>(requestPromise: Promise<T>): Promise<T> => {
  try {
    return await requestPromise;
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    // Graceful error handling for common API issues
    if (error.message?.includes("Requested entity was not found")) {
       // Potential race condition with key selection or invalid model name
       throw new AIError("Engine Handshake Failed: System recalibrating. Please try again in a moment.");
    }
    throw new AIError(error.message || "An unexpected error occurred in the Webvic Flow engine.");
  }
};

const extractJSON = (text: string | undefined) => {
  if (!text) return null;
  try {
    // Robust cleaning to handle potential markdown code blocks or leading/trailing text
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
  const ai = getAI();
  const response = await handleAIRequest(ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [{
        text: `Platform: ${platformId}. Handle: ${handle}. Brand: ${brandName}. 
        Simulate a successful OAuth verification via the Webvictech Auth Gateway. Return a JSON object with: 
        profileName (Realistic name), avatarUrl (a high-quality professional profile picture URL), followers (realistic number like 12.4k).`
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

  const data = extractJSON(response.text) || { 
    profileName: "Authorized User", 
    avatarUrl: "", 
    followers: "1.0k" 
  };
  
  return {
    platformId,
    handle,
    profileName: data.profileName,
    // Use a more reliable avatar service than the retired Unsplash source
    avatarUrl: data.avatarUrl || `https://ui-avatars.com/api/?name=${handle || platformId}&background=random&color=fff&size=128`,
    followers: data.followers,
    tokenStatus: 'active',
    connectedAt: new Date().toISOString()
  };
};

export const executeProductionDeployment = async (
  post: SocialPost, 
  onStageChange: (stage: 'handshake' | 'upload' | 'propagate' | 'verify') => void
): Promise<string> => {
  const stages: ('handshake' | 'upload' | 'propagate' | 'verify')[] = ['handshake', 'upload', 'propagate', 'verify'];
  for (const stage of stages) {
    onStageChange(stage);
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
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
  const ai = getAI();
  const sanitizedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  const response = await handleAIRequest(ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: {
      parts: [{
        text: `Analyze the company profile for the URL: ${sanitizedUrl}. 
        Provide: Official Brand Name, Tagline, Brand Voice, Target Audience, and a Detailed Professional Summary. 
        If possible, suggest a placeholder Logo URL.`
      }]
    },
    config: { 
      temperature: 0.2,
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
    summary: "Detailed analysis currently processing."
  };
  return { ...data, sources: [] };
};

export const analyzeAndGeneratePosts = async (
  url: string, 
  manualData?: { companyName: string; tagline: string },
  updateProgress?: (status: string) => void
): Promise<GenerationResult & { logoUrl?: string }> => {
  const ai = getAI();
  const sanitizedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  if (updateProgress) updateProgress("Scanning digital footprint...");
  const brandIntel = await researchCompany(sanitizedUrl);
  
  const context = `
    BRAND: ${manualData?.companyName || brandIntel.companyName}
    TAGLINE: ${manualData?.tagline || brandIntel.tagline}
    VOICE: ${brandIntel.brandVoice}
    AUDIENCE: ${brandIntel.targetAudience}
    RESEARCH DATA: ${brandIntel.summary}
  `;

  if (updateProgress) updateProgress("Synthesizing multi-channel design strategies...");

  const response = await handleAIRequest(ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: {
      parts: [{
        text: `Based on this brand context: ${context}, generate exactly TWO (2) UNIQUE POSTS for each platform: linkedin, facebook, instagram, threads, twitter.
        
        CRITICAL RULES:
        1. platformId MUST BE ALL LOWERCASE.
        2. content: Full professional marketing copy for the social media caption.
        3. graphicHeadline: A SHORT, PUNCHY 3-8 WORD HEADLINE that summarizes the post content. This is for the VISUAL IMAGE OVERLAY.
        4. visualPrompt: Describe an ATMOSPHERIC BACKGROUND DESIGN ASSET. Focus on: Clean professional layouts, 3D isometric metaphors, modern SaaS branding elements, and sleek gradients. DO NOT INCLUDE TEXT in the background asset.
        
        Return response strictly as valid JSON.`
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
                suggestedTime: { type: Type.STRING },
                visualPrompt: { type: Type.STRING }
              },
              required: ["platformId", "content", "graphicHeadline", "hashtags", "suggestedTime", "visualPrompt"]
            }
          }
        },
        required: ["companyName", "tagline", "posts"]
      }
    }
  }));

  const data = extractJSON(response.text);
  if (!data) throw new Error("Pipeline Synthesis Error: Engine output was non-parseable.");
  
  const defaultDesignConfig: DesignConfig = {
    logoPosition: 'top-left',
    logoX: 10,
    logoY: 10,
    logoSize: 120, // Increased default logo size for better visibility
    textPosition: 'center',
    textX: 50,
    textY: 50,
    textSize: 48,
    textAlign: 'center'
  };

  if (data.posts) {
    data.posts = data.posts.map((p: any) => ({ 
      ...p, 
      platformId: p.platformId.toLowerCase(),
      status: 'draft',
      designConfig: { ...defaultDesignConfig }
    }));
  }
  
  return { 
    ...data, 
    sources: [], 
    researchSummary: brandIntel.summary, 
    logoUrl: brandIntel.logoUrl 
  };
};

export const generateImageForPost = async (visualPrompt: string): Promise<string> => {
  const ai = getAI();
  const masterPrompt = `
    ACT AS A WORLD-CLASS GRAPHIC DESIGNER. 
    TASK: Create a professional social media marketing BACKGROUND ASSET.
    VISUAL THEME: ${visualPrompt}. 
    STYLE: Modern, sleek, high-end corporate aesthetic. CINEMATIC. 4K detail.
    CRITICAL INSTRUCTION: BACKGROUND ONLY. ABSOLUTELY NO TEXT, NO LOGOS, NO LETTERS.
  `.trim();

  const response = await handleAIRequest(ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: masterPrompt }] },
    config: { 
      imageConfig: { 
        aspectRatio: "1:1"
      } 
    }
  }));

  // Robust part iteration to find the image data
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error("Design synthesis failed: Engine returned no image data.");
};

export const conductMarketResearch = async (query: string): Promise<{ text: string; sources: ResearchSource[] }> => {
  const ai = getAI();
  const response = await handleAIRequest(ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: `Conduct deep market intelligence research on: ${query}. Focus on recent trends and competitive benchmarks.` }] },
    config: { tools: [{ googleSearch: {} }] }
  }));
  const text = response.text || "Analysis failed: Grounding signal lost.";
  const sources: ResearchSource[] = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .filter(chunk => chunk.web)
    .map(chunk => ({ uri: chunk.web!.uri, title: chunk.web!.title || chunk.web!.uri }));
  return { text, sources };
};

export const generateVisualAnalytics = async (input: string): Promise<AnalyticsReport> => {
  const ai = getAI();
  const response = await handleAIRequest(ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: `Process this narrative into structured analytics: ${input}` }] },
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
  const data = extractJSON(response.text);
  if (!data) throw new Error("Analytics rendering failed: Data integrity check failed.");
  return data;
};

export const generateMarketingContent = async (topic: string): Promise<ContentIdea[]> => {
  const ai = getAI();
  const response = await handleAIRequest(ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: `Generate unique marketing architectures and high-fidelity campaign hooks for: ${topic}` }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "description", "tags"] } }
    }
  }));
  return extractJSON(response.text) || [];
};
