import { GoogleGenAI, Type } from "@google/genai";
import { BiometricDataPoint, AIResponse } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client only if the key exists to avoid immediate errors, 
// though actual calls will fail without it.
const ai = new GoogleGenAI({ apiKey });

const MODEL_ID = "gemini-2.5-flash";

export const analyzeStress = async (
  recentData: BiometricDataPoint[]
): Promise<AIResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  // Summarize data for the prompt to save tokens
  const averageHR = Math.round(recentData.reduce((acc, curr) => acc + curr.heartRate, 0) / recentData.length);
  const averageGSR = (recentData.reduce((acc, curr) => acc + curr.gsr, 0) / recentData.length).toFixed(2);
  const currentStress = recentData[recentData.length - 1].stressScore;
  const trend = recentData[0].stressScore < currentStress ? "increasing" : "decreasing";

  const prompt = `
    Analyze the following user biometric data:
    - Average Heart Rate: ${averageHR} BPM
    - Average Skin Conductance (GSR): ${averageGSR} uS
    - Current Calculated Stress Score: ${currentStress}/100
    - Trend: Stress is ${trend}.
    
    The user is using a biofeedback application. 
    Provide a JSON response with:
    1. A short analysis of their physiological state (1-2 sentences).
    2. A list of 2-3 specific, actionable recommendations to manage or reduce stress immediately.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['breathing', 'cognitive', 'physical', 'mindfulness'] }
                },
                required: ['title', 'description', 'type']
              }
            }
          },
          required: ['analysis', 'recommendations']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
