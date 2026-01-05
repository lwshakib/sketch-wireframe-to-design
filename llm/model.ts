import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const getSingleAPIKey = () => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not set");
  }
  const keys = apiKey.split(",");
  return keys[Math.floor(Math.random() * keys.length)];
};

export const GeminiModel = () => {
  const google = createGoogleGenerativeAI({
    apiKey: getSingleAPIKey(),
  });
  return google("gemini-2.5-flash-lite"); 
};
