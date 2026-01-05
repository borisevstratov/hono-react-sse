import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { generateText, streamGenerateText } from "./gemini";
import index from "./client/index.html";
import { serve } from "bun";

const app = new Hono().basePath("/api");

app.get("/generate", async (c) => {
	const prompt = c.req.query("prompt") || "Hello, Gemini!";
	const text = await generateText(prompt);
	return c.text(text);
});

app.get("/stream", async (c) => {
	const prompt =
		c.req.query("prompt") || "Write a short story about a space pirate.";

	return streamSSE(c, async (stream) => {
		try {
			const responseStream = await streamGenerateText(prompt);

			for await (const chunk of responseStream) {
				const candidate = chunk.candidates?.[0];
				const parts = candidate?.content?.parts || [];

				for (const part of parts) {
					if (part.thought) {
						if (part.text) {
							await stream.writeSSE({
								data: JSON.stringify({ thought: part.text }),
								event: "thought",
							});
						}
					} else {
						if (part.text) {
							await stream.writeSSE({
								data: JSON.stringify({ text: part.text }),
								event: "message",
							});
						}
					}
				}
			}
			// Send explicit end event to prevent client-side EventSource from interpreting closure as an error
			await stream.writeSSE({
				data: JSON.stringify({ status: "done" }),
				event: "end",
			});
		} catch (error) {
			console.error("SSE Error:", error);
			await stream.writeSSE({
				data: JSON.stringify({ error: "Failed to generate content" }),
				event: "error",
			});
		}
	});
});

const port = Number(Bun.env.PORT) || 3080;

const server = serve({
	port: port,
	routes: {
		// API routes
		"/api/*": app.fetch,
		// React web ui
		"/*": index,
	},
	development: Bun.env.NODE_ENV !== "production" && {
		hmr: true,
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);
