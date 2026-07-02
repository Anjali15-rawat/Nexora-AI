import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Player } from "@lottiefiles/react-lottie-player";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Send, Loader2, Mic, MicOff, Maximize2, Minimize2, Sparkles, User, X, Volume2, AlertCircle } from "lucide-react";
import { sendChatMessage, getChatHistory, askVoiceAgentContextual } from "@/lib/api/copilot.functions";
import { cn } from "@/lib/utils";
import { speakNora, stopSpeech } from "@/lib/speech";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

export function AdvisorPanel({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [listening, setListening] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking" | "error">("idle");
  const endRef = useRef<HTMLDivElement>(null);

  const recognitionRef = useRef<any>(null);
  const greetingPlayedRef = useRef(false);

  // Load History
  useEffect(() => {
    if (!open && !initializing) return;
    
    async function loadHistory() {
      try {
        const history = await getChatHistory();
        setMessages(history as Msg[]);
      } catch (e) {
        setMessages([
          { role: "assistant", content: "Hi! I'm Nora, your AI Growth Advisor. I've reviewed your latest business reports. How can I help you grow today?" },
        ]);
      } finally {
        setInitializing(false);
      }
    }
    if (open && initializing) {
      loadHistory();
    }
  }, [open, initializing]);

  useEffect(() => {
    const handleOpenAdvisor = (e: Event) => {
      const customEvent = e as CustomEvent;
      setOpen(true);
      if (customEvent.detail?.message) {
        setInput(customEvent.detail.message);
      }
    };
    window.addEventListener("open-advisor", handleOpenAdvisor);
    return () => window.removeEventListener("open-advisor", handleOpenAdvisor);
  }, []);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, loading]);

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
      
      setMessages((m) => [...m, { role: "user", content: transcript }]);
      setVoiceState("thinking");
      setLoading(true);
      
      try {
        const response = await askVoiceAgentContextual({ data: { query: transcript } });
        setMessages((m) => [...m, { role: "assistant", content: response.textResponse }]);
        
        setVoiceState("speaking");
        setLoading(false);
        await speakNora(response.textResponse);
        
        if (mode === "voice" && open) {
          startListeningLoop();
        }
      } catch (e) {
        console.error("[Voice] Contextual query failed:", e);
        setMessages((m) => [...m, { role: "assistant", content: "I encountered an issue. Please try again." }]);
        setVoiceState("error");
        setLoading(false);
      }
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
    
    setMessages((m) => {
      if (m.length > 0 && m[m.length - 1].content === greetingText) {
        return m;
      }
      return [...m, { role: "assistant", content: greetingText }];
    });

    await speakNora(greetingText);
    
    if (mode === "voice" && open) {
      startListeningLoop();
    }
  };

  useEffect(() => {
    if (open && mode === "voice") {
      if (!greetingPlayedRef.current) {
        greetingPlayedRef.current = true;
        playGreeting();
      }
    } else {
      greetingPlayedRef.current = false;
      stopVoiceLoop();
    }
  }, [open, mode]);

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

  const handleSendText = async (text: string) => {
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-gradient-primary z-50 hover:scale-105 transition-transform">
            <Sparkles className="h-6 w-6" />
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className={cn(
          "flex flex-col p-0 border-l border-border transition-all duration-300",
          expanded ? "sm:max-w-[800px] w-full" : "sm:max-w-[450px] w-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20">
              <Player
                src="https://lottie.host/80e9a7e6-7eb4-4db2-9443-41bb2f45cc35/qY6rC6jB18.json" // Using a generic assistant lottie as placeholder
                loop
                autoplay
                style={{ height: '40px', width: '40px' }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Nora</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
          {initializing ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 grid place-items-center shrink-0 border border-primary/20">
                      <Player src="https://lottie.host/80e9a7e6-7eb4-4db2-9443-41bb2f45cc35/qY6rC6jB18.json" loop autoplay style={{ height: '32px', width: '32px' }} />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed prose prose-sm dark:prose-invert ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border shadow-sm"}`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                  {m.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-muted grid place-items-center shrink-0 border border-border">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 grid place-items-center shrink-0 border border-primary/20">
                     <Player src="https://lottie.host/80e9a7e6-7eb4-4db2-9443-41bb2f45cc35/qY6rC6jB18.json" loop autoplay style={{ height: '32px', width: '32px' }} />
                  </div>
                  <div className="bg-card border border-border rounded-2xl px-4 py-3 text-sm shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </>
          )}
        </div>

        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2 mb-3 bg-muted/50 p-1 rounded-lg w-fit mx-auto">
            <Button 
              variant={mode === "text" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-7 text-xs rounded-md px-3"
              onClick={() => setMode("text")}
            >
              Text
            </Button>
            <Button 
              variant={mode === "voice" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-7 text-xs rounded-md px-3"
              onClick={() => setMode("voice")}
            >
              Voice
            </Button>
          </div>

          {mode === "text" ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSendText(input); }} className="relative flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendText(input); } }}
                placeholder="Ask about your growth..."
                className="resize-none pr-14 min-h-[50px] max-h-[150px] bg-muted/50 focus:bg-card border-border/50 text-sm py-3"
                disabled={loading}
              />
              <Button type="submit" size="icon" className="absolute right-2 bottom-2 h-8 w-8 bg-gradient-primary border-0 rounded-md" disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <button
                onClick={toggleListen}
                className={cn(
                  "relative h-16 w-16 rounded-full grid place-items-center transition-all cursor-pointer",
                  voiceState === "listening" ? "bg-gradient-primary shadow-glow scale-105" :
                  voiceState === "speaking" ? "bg-primary/10 border border-primary animate-pulse" :
                  voiceState === "thinking" ? "bg-muted animate-pulse" :
                  "bg-muted border border-border hover:border-primary/40"
                )}
              >
                {voiceState === "listening" && (
                  <>
                    <motion.span className="absolute inset-0 rounded-full bg-primary/30" animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.span className="absolute inset-0 rounded-full bg-primary/20" animate={{ scale: [1, 2], opacity: [0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
                  </>
                )}
                {voiceState === "listening" ? (
                  <Mic className="h-6 w-6 text-primary-foreground relative animate-pulse" />
                ) : voiceState === "thinking" ? (
                  <Loader2 className="h-6 w-6 text-primary relative animate-spin" />
                ) : voiceState === "speaking" ? (
                  <Volume2 className="h-6 w-6 text-primary relative" />
                ) : voiceState === "error" ? (
                  <AlertCircle className="h-6 w-6 text-destructive relative" />
                ) : (
                  <MicOff className="h-6 w-6 text-muted-foreground relative" />
                )}
              </button>

              {/* Soundwave animation when speaking */}
              {voiceState === "speaking" && (
                <div className="flex items-center gap-1 h-6 mt-3 justify-center">
                  <span className="w-1 bg-primary rounded-full animate-soundwave-1" style={{ height: "16px" }}></span>
                  <span className="w-1 bg-primary rounded-full animate-soundwave-2" style={{ height: "16px" }}></span>
                  <span className="w-1 bg-primary rounded-full animate-soundwave-3" style={{ height: "16px" }}></span>
                  <span className="w-1 bg-primary rounded-full animate-soundwave-4" style={{ height: "16px" }}></span>
                </div>
              )}

              <div className="mt-3 text-xs font-medium text-muted-foreground">
                {voiceState === "listening" ? "Listening to you..." :
                 voiceState === "thinking" ? "Nora is thinking..." :
                 voiceState === "speaking" ? "Nora is speaking..." :
                 voiceState === "error" ? "Mic error. Tap to retry." :
                 "Tap to speak"}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
