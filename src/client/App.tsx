/** biome-ignore-all lint/a11y/noSvgWithoutTitle: This was vibe-coded */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: This was vibe-coded */
/** biome-ignore-all lint/correctness/useExhaustiveDependencies: This was vibe-coded */
import { useEffect, useRef, useState, type FormEvent } from "react";
import Markdown from "markdown-to-jsx";

interface Message {
	role: "user" | "assistant";
	content: string;
	thought?: string;
}

export default function App() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [currentThought, setCurrentThought] = useState("");
	const [currentResponse, setCurrentResponse] = useState("");
	const thoughtRef = useRef("");
	const responseRef = useRef("");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages, currentResponse, currentThought]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		const userMessage: Message = { role: "user", content: input };
		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);
		setCurrentResponse("");
		setCurrentThought("");
		thoughtRef.current = "";
		responseRef.current = "";

		const url = `/api/stream?prompt=${encodeURIComponent(input)}`;
		const eventSource = new EventSource(url);

		const finishStream = () => {
			const finalThought = thoughtRef.current;
			const finalResponse = responseRef.current;

			setMessages((prev) => {
				if (finalResponse || finalThought) {
					return [
						...prev,
						{
							role: "assistant",
							content: finalResponse,
							thought: finalThought,
						},
					];
				}
				return prev;
			});
			setCurrentResponse("");
			setCurrentThought("");
			thoughtRef.current = "";
			responseRef.current = "";
			setIsLoading(false);
			eventSource.close();
		};

		try {
			eventSource.addEventListener("thought", (event) => {
				const data = JSON.parse(event.data);
				thoughtRef.current += data.thought;
				setCurrentThought(thoughtRef.current);
			});

			eventSource.addEventListener("message", (event) => {
				const data = JSON.parse(event.data);
				responseRef.current += data.text;
				setCurrentResponse(responseRef.current);
			});

			eventSource.addEventListener("end", () => {
				finishStream();
			});

			eventSource.addEventListener("error", (event) => {
				if (
					eventSource.readyState !== EventSource.CLOSED &&
					eventSource.readyState !== EventSource.CONNECTING
				) {
					console.error("SSE Error:", event);
				}
				if (isLoading) {
					finishStream();
				}
			});
		} catch (error) {
			console.error("Failed to start stream:", error);
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-screen bg-[#1a1b26] text-[#c0caf5]">
			{/* Header */}
			<header className="p-4 border-b border-[#414868] bg-[#1a1b26]/80 backdrop-blur-md sticky top-0 z-10">
				<h1 className="text-xl font-bold bg-gradient-to-r from-[#7aa2f7] to-[#bb9af7] bg-clip-text text-transparent">
					Gemini SSE Chat
				</h1>
			</header>

			{/* Chat Area */}
			<main className="flex-1 overflow-y-auto p-4 space-y-6">
				{messages.length === 0 && !isLoading && (
					<div className="h-full flex flex-col items-center justify-center text-[#565f89]">
						<p className="text-lg">How can I help you today?</p>
					</div>
				)}

				{messages.map((msg, i) => (
					<div
						key={i}
						className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
					>
						<div
							className={`max-w-[80%] rounded-2xl p-4 ${
								msg.role === "user"
									? "bg-[#3b4261] text-[#c0caf5] rounded-tr-none border border-[#414868]"
									: "bg-[#24283b] border border-[#414868] rounded-tl-none"
							}`}
						>
							{msg.thought && (
								<details className="mb-3 text-sm text-[#565f89] border-l-2 border-[#414868] pl-3">
									<summary className="cursor-pointer hover:text-[#9aa5ce] transition-colors font-medium">
										Thinking Process
									</summary>
									<div
										className="mt-2 italic whitespace-pre-wrap prose prose-invert prose-sm max-w-none 
										prose-p:leading-relaxed prose-p:my-1
										prose-code:text-[#7aa2f7] prose-code:bg-[#414868]/30 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
										prose-pre:bg-[#1a1b26] prose-pre:border prose-pre:border-[#414868] prose-pre:p-2 prose-pre:rounded"
									>
										<Markdown>{msg.thought}</Markdown>
									</div>
								</details>
							)}
							<div
								className="prose prose-invert prose-sm max-w-none 
								prose-headings:text-[#7aa2f7] prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
								prose-p:leading-relaxed prose-p:my-2
								prose-a:text-[#7aa2f7] prose-a:underline
								prose-strong:text-[#bb9af7] prose-strong:font-bold
								prose-code:text-[#7aa2f7] prose-code:bg-[#414868]/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
								prose-pre:bg-[#1a1b26] prose-pre:border prose-pre:border-[#414868] prose-pre:p-4 prose-pre:rounded-lg
								prose-ul:list-disc prose-ul:pl-6 prose-ul:my-2
								prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-2
								prose-li:my-1
								prose-blockquote:border-l-4 prose-blockquote:border-[#414868] prose-blockquote:pl-4 prose-blockquote:italic text-[#c0caf5]"
							>
								<Markdown>{msg.content}</Markdown>
							</div>
						</div>
					</div>
				))}

				{/* Live Streaming Response */}
				{isLoading && (currentThought || currentResponse) && (
					<div className="flex justify-start">
						<div className="max-w-[80%] rounded-2xl p-4 bg-[#24283b] border border-[#414868] rounded-tl-none animate-in fade-in slide-in-from-bottom-2">
							{currentThought && (
								<div className="mb-3 text-sm text-[#565f89] border-l-2 border-[#7aa2f7]/50 pl-3">
									<div className="flex items-center gap-2 mb-1">
										<span className="relative flex h-2 w-2">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7aa2f7] opacity-75"></span>
											<span className="relative inline-flex rounded-full h-2 w-2 bg-[#7aa2f7]"></span>
										</span>
										<span className="font-medium text-[#7aa2f7]">
											Thinking...
										</span>
									</div>
									<div
										className="italic whitespace-pre-wrap opacity-70 prose prose-invert prose-sm max-w-none 
										prose-p:leading-relaxed prose-p:my-1
										prose-code:text-[#7aa2f7] prose-code:bg-[#414868]/30 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
										prose-pre:bg-[#1a1b26] prose-pre:border prose-pre:border-[#414868] prose-pre:p-2 prose-pre:rounded"
									>
										<Markdown>{currentThought}</Markdown>
									</div>
								</div>
							)}
							{currentResponse && (
								<div
									className="prose prose-invert prose-sm max-w-none 
									prose-headings:text-[#7aa2f7] prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
									prose-p:leading-relaxed prose-p:my-2
									prose-a:text-[#7aa2f7] prose-a:underline
									prose-strong:text-[#bb9af7] prose-strong:font-bold
									prose-code:text-[#7aa2f7] prose-code:bg-[#414868]/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
									prose-pre:bg-[#1a1b26] prose-pre:border prose-pre:border-[#414868] prose-pre:p-4 prose-pre:rounded-lg
									prose-ul:list-disc prose-ul:pl-6 prose-ul:my-2
									prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-2
									prose-li:my-1
									prose-blockquote:border-l-4 prose-blockquote:border-[#414868] prose-blockquote:pl-4 prose-blockquote:italic text-[#c0caf5]"
								>
									<Markdown>{currentResponse}</Markdown>
								</div>
							)}
							{!currentResponse && !currentThought && (
								<div className="flex gap-1">
									<div className="w-2 h-2 bg-[#414868] rounded-full animate-bounce"></div>
									<div className="w-2 h-2 bg-[#414868] rounded-full animate-bounce [animation-delay:0.2s]"></div>
									<div className="w-2 h-2 bg-[#414868] rounded-full animate-bounce [animation-delay:0.4s]"></div>
								</div>
							)}
						</div>
					</div>
				)}
				<div ref={messagesEndRef} />
			</main>

			{/* Input Area */}
			<footer className="p-4 border-t border-[#414868] bg-[#1a1b26]">
				<form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask Gemini anything..."
						disabled={isLoading}
						className="flex-1 bg-[#24283b] border border-[#414868] text-[#c0caf5] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7aa2f7]/50 placeholder-[#565f89] transition-all disabled:opacity-50"
					/>
					<button
						type="submit"
						disabled={isLoading || !input.trim()}
						className="bg-[#7aa2f7] hover:bg-[#89b4fa] text-[#1a1b26] disabled:bg-[#414868] disabled:text-[#565f89] px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2"
					>
						{isLoading ? (
							<svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
									fill="none"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
						) : (
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.5}
									d="M14 5l7 7m0 0l-7 7m7-7H3"
								/>
							</svg>
						)}
						Send
					</button>
				</form>
				<p className="text-center text-[10px] text-[#565f89] mt-2 font-medium">
					Powered by Gemini 2.5 Flash & Hono SSE
				</p>
			</footer>
		</div>
	);
}
