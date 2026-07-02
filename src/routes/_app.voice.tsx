import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/app/cards";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { askVoiceAgentContextual } from "@/lib/api/copilot.functions";
import { Mic, MicOff, Search, Swords, Lightbulb, Send, Loader2, TrendingUp, Volume2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { speakNora, stopSpeech } from "@/lib/speech";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/voice")({
  head: () => ({ meta: [{ title: "Nora (Voice Assistant) · Nexora AI" }] }),
  component: Voice,
});

const cards = [
  { icon: Search, label: "What should I focus on today?" },
  { icon: Swords, label: "Who is my biggest competitor?" },
  { icon: Lightbulb, label: "What opportunities am I missing?" },
  { icon: TrendingUp, label: "Why is my score low?" },
];

function Voice() {
  const [listening, setListening] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ you: string; copilot: string }>>([]);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking" | "error">("idle");

  const recognitionRef = useRef<any>(null);
  const greetingPlayedRef = useRef(false);

  const stopVoiceLoop = () => {
    stopSpeech();
    if (recognitionRef.current) {
      console.log("[Voice] Speech recognition stopped");
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setListening(false);
    setVoiceState("idle");
  };

  const startListeningLoop = () => {
    if (typeof window === "undefined") return;
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setVoiceState("error");
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    stopVoiceLoop();

    console.log("[Voice] Speech recognition started");
    setVoiceState("listening");
    setListening(true);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log(`[Voice] Speech recognized user input: "${transcript}"`);
      
      recognition.onend = null;
      recognition.onerror = null;
      setListening(false);
      
      handleAsk(transcript);
    };

    recognition.onerror = (e: any) => {
      console.error("[Voice] Speech recognition error:", e);
      if (e.error === "no-speech") {
        setVoiceState("idle");
        setListening(false);
      } else {
        setVoiceState("error");
        setListening(false);
        if (e.error === "not-allowed") {
          toast.error("Microphone access denied. Please click the icon in your browser's address bar to allow microphone access.", {
            duration: 6000,
          });
        } else if (e.error === "audio-capture") {
          toast.error("No microphone detected. Please plug in or enable a microphone in your system settings.");
        } else if (e.error === "network") {
          toast.error("Network error: Internet connection required for browser speech recognition.");
        } else {
          toast.error(`Speech recognition failed: ${e.error || "unknown error"}`);
        }
      }
    };

    recognition.onend = () => {
      console.log("[Voice] Speech recognition stopped");
      setListening(false);
      setVoiceState((current) => (current === "listening" ? "idle" : current));
    };

    recognition.start();
  };

  const playGreeting = async () => {
    console.log("[Voice] Playing automatic greeting");
    setVoiceState("speaking");
    const greetingText = "Hello, I'm Nora, your AI Chief Growth Officer. I've analyzed your business. How can I help you today?";
    
    await speakNora(greetingText);
    
    startListeningLoop();
  };

  useEffect(() => {
    if (!greetingPlayedRef.current) {
      greetingPlayedRef.current = true;
      playGreeting();
    }
    return () => {
      stopVoiceLoop();
    };
  }, []);

  const handleAsk = async (text: string) => {
    if (!text.trim() || loading) return;
    stopVoiceLoop(); // Interrupt current playback
    
    setVoiceState("thinking");
    setLoading(true);
    setQuery("");
    
    try {
      const response = await askVoiceAgentContextual({ data: { query: text } });
      setHistory(prev => [
        { you: text, copilot: response.textResponse },
        ...prev,
      ]);
      
      setVoiceState("speaking");
      setLoading(false);
      await speakNora(response.textResponse);
      
      startListeningLoop();
    } catch (e) {
      console.error("[Voice] Ask failed:", e);
      setHistory(prev => [
        { you: text, copilot: "I encountered an issue. Please try again." },
        ...prev,
      ]);
      setVoiceState("error");
      setLoading(false);
    }
  };

  const toggleListen = () => {
    if (voiceState === "speaking") {
      stopSpeech();
      startListeningLoop();
    } else if (voiceState === "listening") {
      stopVoiceLoop();
    } else {
      startListeningLoop();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nora (Voice Assistant)" description="Hands-free growth standup — powered by your real business data." />

      <Card className="bg-gradient-surface">
        <CardContent className="py-16 flex flex-col items-center justify-center">
          <button
            onClick={toggleListen}
            className={cn(
              "relative h-32 w-32 rounded-full grid place-items-center transition-all cursor-pointer",
              voiceState === "listening" ? "bg-gradient-primary shadow-glow scale-105" :
              voiceState === "speaking" ? "bg-primary/10 border border-primary animate-pulse" :
              voiceState === "thinking" ? "bg-muted animate-pulse" :
              "bg-card border border-border hover:border-primary/40"
            )}
          >
            {voiceState === "listening" && (
              <>
                <motion.span className="absolute inset-0 rounded-full bg-primary/30" animate={{ scale: [1, 1.6], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
                <motion.span className="absolute inset-0 rounded-full bg-primary/20" animate={{ scale: [1, 2], opacity: [0.4, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: 0.4 }} />
              </>
            )}
            {voiceState === "listening" ? (
              <Mic className="h-12 w-12 text-primary-foreground relative animate-pulse" />
            ) : voiceState === "thinking" ? (
              <Loader2 className="h-12 w-12 text-primary relative animate-spin" />
            ) : voiceState === "speaking" ? (
              <Volume2 className="h-12 w-12 text-primary relative" />
            ) : voiceState === "error" ? (
              <AlertCircle className="h-12 w-12 text-destructive relative" />
            ) : (
              <MicOff className="h-12 w-12 text-muted-foreground relative" />
            )}
          </button>

          {/* Soundwave animation when speaking */}
          {voiceState === "speaking" && (
            <div className="flex items-center gap-1.5 h-8 mt-6 justify-center">
              <span className="w-1 bg-primary rounded-full animate-soundwave-1" style={{ height: "24px" }}></span>
              <span className="w-1 bg-primary rounded-full animate-soundwave-2" style={{ height: "24px" }}></span>
              <span className="w-1 bg-primary rounded-full animate-soundwave-3" style={{ height: "24px" }}></span>
              <span className="w-1 bg-primary rounded-full animate-soundwave-4" style={{ height: "24px" }}></span>
            </div>
          )}

          <div className="mt-6 text-sm font-medium text-muted-foreground">
            {voiceState === "listening" ? "Listening to you..." :
             voiceState === "thinking" ? "Nora is thinking..." :
             voiceState === "speaking" ? "Nora is speaking..." :
             voiceState === "error" ? "Mic error. Tap to retry." :
             "Tap to start speaking or type your query below"}
          </div>

          <div className="mt-8 w-full max-w-md flex gap-2">
            <Input
              type="text"
              placeholder="Ask your Copilot..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk(query)}
              disabled={loading}
              className="bg-card border-border/40 text-sm"
            />
            <Button onClick={() => handleAsk(query)} disabled={loading} size="icon" className="bg-gradient-primary border-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} onClick={() => handleAsk(c.label)} className="cursor-pointer hover:border-primary/40 transition-colors">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary grid place-items-center"><c.icon className="h-5 w-5" /></div>
              <div className="text-sm font-medium">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Conversation history</h2>
          <div className="space-y-3">
            {history.map((h, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <div className="text-sm"><span className="text-muted-foreground">You · </span>{h.you}</div>
                  <div className="text-sm border-l-2 border-primary pl-3"><span className="text-primary font-medium">Copilot · </span>{h.copilot}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
