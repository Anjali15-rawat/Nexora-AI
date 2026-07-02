import { generateElevenLabsSpeech } from "@/lib/api/voice.functions";

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let onSpeechEndCallback: (() => void) | null = null;

/**
 * Stops any active SpeechSynthesis or audio playback immediately.
 * Resolves the active speech Promise cleanly.
 */
export function stopSpeech(): void {
  console.log("[Voice] stopSpeech() invoked. Halting all speech and custom audio playback.");
  
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  if (onSpeechEndCallback) {
    console.log("[Voice] Speech promise resolved early due to interruption.");
    const callback = onSpeechEndCallback;
    onSpeechEndCallback = null;
    callback();
  }
}

/**
 * Speaks the text using Nora's custom ElevenLabs voice (or local SpeechSynthesis fallback).
 * Returns a Promise that resolves when the audio playback is fully completed or interrupted.
 */
export function speakNora(text: string): Promise<void> {
  return new Promise<void>(async (resolve) => {
    // 1. Interrupt any existing playback
    stopSpeech();
    
    // Store resolve callback globally so it can be invoked on stopSpeech()
    onSpeechEndCallback = resolve;

    console.log("[Voice] Voice provider initialized");
    console.log("[Voice] ElevenLabs initialized");
    console.log("[Voice] Voice ID loaded from environment");
    console.log(`[Voice] Greeting generated: "${text}"`);
    console.log("[Voice] Audio request sent to ElevenLabs proxy...");

    try {
      const result = await generateElevenLabsSpeech({ data: { text } });
      
      // If we got base64 audio data back
      if (result.success && result.audioBase64) {
        console.log("[Voice] Audio received from ElevenLabs");
        const audioUrl = `data:audio/mp3;base64,${result.audioBase64}`;
        const audio = new Audio(audioUrl);
        currentAudio = audio;

        audio.onplay = () => {
          console.log("[Voice] Audio playback started");
        };

        audio.onended = () => {
          console.log("[Voice] Audio playback completed");
          if (onSpeechEndCallback === resolve) {
            onSpeechEndCallback = null;
            resolve();
          }
        };

        audio.onerror = (e) => {
          console.error("[Voice] Audio playback failed, falling back to speech synthesis:", e);
          fallbackToBrowserSpeech(text, resolve);
        };

        await audio.play();
        return;
      } else {
        console.warn("[Voice] ElevenLabs returned failure state, falling back:", result.error);
      }
    } catch (err) {
      console.warn("[Voice] ElevenLabs request failed, falling back:", err);
    }

    // 2. Fallback to native SpeechSynthesis
    fallbackToBrowserSpeech(text, resolve);
  });
}

function fallbackToBrowserSpeech(text: string, resolve: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("[Voice] SpeechSynthesis API not supported in this browser.");
    resolve();
    return;
  }

  console.log("[Voice] Initializing local browser SpeechSynthesis fallback");
  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  const voices = window.speechSynthesis.getVoices();
  
  // Helper to determine if a voice is female
  const isFemaleVoice = (v: SpeechSynthesisVoice) => {
    const nameLower = v.name.toLowerCase();
    
    // Explicit female names or markers
    const hasFemaleMarker = nameLower.includes("female") || 
                            nameLower.includes("hazel") || 
                            nameLower.includes("samantha") || 
                            nameLower.includes("zira") || 
                            nameLower.includes("susan") || 
                            nameLower.includes("moira") || 
                            nameLower.includes("karen") || 
                            nameLower.includes("tessa") ||
                            nameLower.includes("veena") || 
                            nameLower.includes("heera") ||
                            nameLower.includes("mira") ||
                            nameLower.includes("google uk english");
                            
    // Explicit male names or markers to avoid
    const hasMaleMarker = nameLower.includes("male") || 
                          nameLower.includes("david") || 
                          nameLower.includes("george") || 
                          nameLower.includes("mark") || 
                          nameLower.includes("daniel") || 
                          nameLower.includes("ravi") || 
                          nameLower.includes("oliver") || 
                          nameLower.includes("george mobile") || 
                          nameLower.includes("microsoft david") || 
                          nameLower.includes("microsoft george");
                          
    return hasFemaleMarker || (!hasMaleMarker && !nameLower.includes("male"));
  };

  // 1. Prioritize British English female voice
  let selectedVoice = voices.find(v => v.lang.startsWith("en-GB") && isFemaleVoice(v));
  
  // 2. Fall back to any English female voice (US, AU, IN, etc.)
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith("en") && isFemaleVoice(v));
  }
  
  // 3. Fall back to any female voice
  if (!selectedVoice) {
    selectedVoice = voices.find(v => isFemaleVoice(v));
  }
  
  // 4. Fall back to any British English voice
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith("en-GB"));
  }
  
  // 5. Fall back to any English voice
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith("en"));
  }
  
  // 6. Absolute fallback
  if (!selectedVoice) {
    selectedVoice = voices[0];
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    console.log(`[Voice] Using fallback voice: ${selectedVoice.name} (${selectedVoice.lang})`);
  }

  utterance.onstart = () => {
    console.log("[Voice] Fallback audio playback started");
  };

  utterance.onend = () => {
    console.log("[Voice] Fallback audio playback completed");
    if (onSpeechEndCallback === resolve) {
      onSpeechEndCallback = null;
      resolve();
    }
  };

  utterance.onerror = (e) => {
    console.error("[Voice] Fallback SpeechSynthesis error:", e);
    if (onSpeechEndCallback === resolve) {
      onSpeechEndCallback = null;
      resolve();
    }
  };

  window.speechSynthesis.speak(utterance);
}
