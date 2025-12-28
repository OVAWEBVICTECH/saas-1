
import { GoogleGenAI, Type } from "@google/genai";
import { GenerationResult, ResearchSource, AnalyticsReport, ContentIdea, SocialAccount, SocialPost } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const extractJSON = (text: string) => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid data format returned by engine.");
  }
};

/**
 * Simulates the validation of a social handle by asking Gemini to 
 * verify if it sounds like a real brand handle based on the name.
 */
export const validateSocialHandle = async (platformId: string, handle: string, brandName: string): Promise<SocialAccount> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Platform: ${platformId}. Handle: ${handle}. Brand: ${brandName}. 
    Simulate a successful OAuth verification. Return a JSON object with: 
    profileName (Realistic name), avatarUrl (a placeholder image URL from Unsplash based on category), followers (realistic number like 12.4k).`,
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
  });

  const data = extractJSON(response.text);
  return {
    platformId,
    handle,
    profileName: data.profileName,
    avatarUrl: data.avatarUrl || `https://source.unsplash.com/random/100x100?face,${platformId}`,
    followers: data.followers,
    tokenStatus: 'active',
    connectedAt: new Date().toISOString()
  };
};

/**
 * Simulates a production deployment with multiple stages
 */
export const executeProductionDeployment = async (
  post: SocialPost, 
  onStageChange: (stage: 'handshake' | 'upload' | 'propagate' | 'verify') => void
): Promise<string> => {
  const stages: ('handshake' | 'upload' | 'propagate' | 'verify')[] = ['handshake', 'upload', 'propagate', 'verify'];
  
  for (const stage of stages) {
    onStageChange(stage);
    // Real-world APIs have latency; simulating 1.5s - 3s per stage
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
  }

  // Generate a mock live URL
  return `https://${post.platformId}.com/p/${Math.random().toString(36).substring(7)}`;
};

export const researchCompany = async (url: string): Promise<{ summary: string; sources: ResearchSource[]; logoUrl?: string; companyName?: string; tagline?: string }> => {
  const ai = getAI();
  const sanitizedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze: ${sanitizedUrl}. Identify Brand Name, Tagline, Value Prop, and Logo URL.`,
    config: { tools: [{ googleSearch: {} }], temperature: 0.1 },
  });

  const summary = response.text || '';
  const sources: ResearchSource[] = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => ({
      uri: chunk.web.uri,
      title: chunk.web.title || 'Source',
    }));

  const logoMatch = summary.match(/https?:\/\/[^\s]+?\.(png|svg|jpg|jpeg|webp)/i);
  return { summary, sources, logoUrl: logoMatch ? logoMatch[0] : undefined };
};

export const analyzeAndGeneratePosts = async (
  url: string, 
  manualData?: { companyName: string; tagline: string },
  updateProgress?: (status: string) => void
): Promise<GenerationResult & { logoUrl?: string }> => {
  const ai = getAI();
  const sanitizedUrl = url.startsWith('http') ? url : `https://${url}`;
  
  if (updateProgress) updateProgress("Scanning digital footprint...");
  const { summary, sources, logoUrl } = await researchCompany(sanitizedUrl);
  
  const brandContext = manualData 
    ? `Name: "${manualData.companyName}", Tagline: "${manualData.tagline}".`
    : `Context: "${summary}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${brandContext} Create a Social Campaign. JSON with: companyName, tagline, and array 'posts' with: platformId, content, hashtags, suggestedTime, visualPrompt.`,
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
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedTime: { type: Type.STRING },
                visualPrompt: { type: Type.STRING }
              },
              required: ["platformId", "content", "hashtags", "suggestedTime", "visualPrompt"]
            }
          }
        },
        required: ["companyName", "tagline", "posts"]
      }
    }
  });

  const data = extractJSON(response.text);
  if (data.posts) data.posts = data.posts.map((p: any) => ({ ...p, status: 'draft' }));
  
  return { ...data, sources, researchSummary: summary, logoUrl };
};

export const generateImageForPost = async (visualPrompt: string, content: string, logoUrlOrBase64?: string): Promise<string> => {
  const ai = getAI();
  const parts: any[] = [{ text: `Social media graphic: ${visualPrompt}. Cinematic, 8k.` }];
  if (logoUrlOrBase64?.startsWith('data:')) {
    parts.push({ inlineData: { data: logoUrlOrBase64.split(',')[1], mimeType: "image/png" } });
  }
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });
  const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (imgPart?.inlineData) return `data:image/png;base64,${imgPart.inlineData.data}`;
  throw new Error("No image returned.");
};

export const refinePosts = async (currentResult: GenerationResult, instruction: string): Promise<GenerationResult> => {
  const ai = getAI();
  const sanitizedPosts = currentResult.posts.map(({ visualUrl, ...rest }) => ({ ...rest, hasGraphic: !!visualUrl }));
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Adjust campaign. Feedback: "${instruction}". Brand: ${currentResult.companyName}. Context: ${JSON.stringify(sanitizedPosts)}`,
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
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedTime: { type: Type.STRING },
                visualPrompt: { type: Type.STRING }
              },
              required: ["platformId", "content", "hashtags", "suggestedTime", "visualPrompt"]
            }
          }
        },
        required: ["companyName", "tagline", "posts"]
      }
    }
  });
  const data = extractJSON(response.text);
  return { ...data, sources: currentResult.sources, researchSummary: currentResult.researchSummary };
};

export const conductMarketResearch = async (query: string): Promise<{ text: string; sources: ResearchSource[] }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Research: ${query}`,
    config: { tools: [{ googleSearch: {} }] },
  });
  const sources: ResearchSource[] = (response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => ({ uri: chunk.web.uri, title: chunk.web.title || 'Source' }));
  return { text: response.text || '', sources };
};

export const generateVisualAnalytics = async (input: string): Promise<AnalyticsReport> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze data: ${input}`,
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
  });
  return extractJSON(response.text);
};

export const generateMarketingContent = async (topic: string): Promise<ContentIdea[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Marketing ideas: ${topic}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "description", "tags"] } }
    }
  });
  return extractJSON(response.text);
};
