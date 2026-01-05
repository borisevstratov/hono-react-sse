import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
	apiKey: Bun.env.GEMINI_API_KEY,
});

/**
 * Generates text using Gemini 2.5 Flash model
 * @param prompt - The input text for generation
 * @returns The generated text response
 */
export async function generateText(prompt: string): Promise<string> {
	try {
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: prompt,
		});

		return response.text || "";
	} catch (error) {
		console.error("Error generating text with Gemini:", error);
		throw error;
	}
}

/**
 * Streams text generation using Gemini 2.5 Flash model
 * @param prompt - The input text for generation
 * @returns A stream of chunks
 */
export async function streamGenerateText(prompt: string) {
	return ai.models.generateContentStream({
		model: "gemini-2.5-flash",
		contents: prompt,
		config: {
			thinkingConfig: {
				includeThoughts: true,
				thinkingBudget: 1024,
			},
		},
	});
}
