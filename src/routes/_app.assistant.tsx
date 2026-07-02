import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/app/cards";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { sendChatMessage, getChatHistory } from "@/lib/api/copilot.functions";
import { Send, Sparkles, User, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({ meta: [{ title: "Nora (AI Assistant) · Nexora AI" }] }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Why is my traffic dropping?",
  "What should I focus on today?",
  "What opportunities am I missing?",
  "Which competitor is growing fastest?",
];

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await getChatHistory();
        setMessages(history as Msg[]);
      } catch (e) {
        setMessages([
          { role: "assistant", content: "Hi there, I'm Nora — I've reviewed your business overnight. Ask me anything about your growth, competitors, or opportunities." },
        ]);
      } finally {
        setInitializing(false);
      }
    }
    loadHistory();
  }, []);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage({ data: { message: userMsg } });
      setMessages((m) => [...m, { role: "assistant", content: result.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I encountered an issue processing your request. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="Nora (AI Assistant)" description="Grounded in your store, competitors, and customer data." />

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shrink-0 shadow-glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed prose prose-sm dark:prose-invert ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
              {m.role === "assistant" ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
            </div>
            {m.role === "user" && (
              <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center shrink-0 shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 2 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
          {suggestions.map((p) => (
            <Card key={p} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => send(p)}>
              <CardContent className="p-3 text-sm">{p}</CardContent>
            </Card>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-4 relative">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Ask anything about your business…"
          className="resize-none pr-14 min-h-[60px] bg-card"
          disabled={loading}
        />
        <Button type="submit" size="icon" className="absolute right-2 bottom-2 bg-gradient-primary border-0" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
