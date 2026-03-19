import type { Adjustments, FilterPreset } from "@/contexts/EditorContext";
import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceAction =
  | { type: "SET_ADJUSTMENT"; key: keyof Adjustments; value: number }
  | { type: "SET_FILTER"; filter: FilterPreset }
  | { type: "SET_SPECIAL_EFFECT"; effect: string | null }
  | { type: "UNDO" }
  | { type: "RESET" }
  | { type: "TOGGLE_BEFORE_AFTER" }
  | { type: "ROTATE_90"; dir: "left" | "right" }
  | { type: "FLIP_H" }
  | { type: "CUSTOM"; command: string };

interface UseVoiceCommandsOptions {
  onCommand: (action: VoiceAction | null) => void;
}

interface UseVoiceCommandsResult {
  isListening: boolean;
  isSupported: boolean;
  toggleListening: () => void;
}

function parseTranscript(transcript: string): VoiceAction | null {
  const t = transcript.toLowerCase().trim();

  // Brightness
  if (
    t.includes("brightness badhao") ||
    t.includes("brightness increase") ||
    t.includes("roshan karo")
  ) {
    return { type: "SET_ADJUSTMENT", key: "brightness", value: 20 };
  }
  if (
    t.includes("brightness kam karo") ||
    t.includes("brightness decrease") ||
    t.includes("dark karo")
  ) {
    return { type: "SET_ADJUSTMENT", key: "brightness", value: -20 };
  }

  // Contrast
  if (t.includes("contrast badhao") || t.includes("contrast increase")) {
    return { type: "SET_ADJUSTMENT", key: "contrast", value: 20 };
  }
  if (t.includes("contrast kam karo") || t.includes("contrast decrease")) {
    return { type: "SET_ADJUSTMENT", key: "contrast", value: -20 };
  }

  // Saturation
  if (
    t.includes("saturation badhao") ||
    t.includes("saturation increase") ||
    t.includes("rang badhao")
  ) {
    return { type: "SET_ADJUSTMENT", key: "saturation", value: 20 };
  }
  if (
    t.includes("saturation kam karo") ||
    t.includes("saturation decrease") ||
    t.includes("rang kam karo")
  ) {
    return { type: "SET_ADJUSTMENT", key: "saturation", value: -20 };
  }

  // Filters
  if (t.includes("cinematic"))
    return { type: "SET_FILTER", filter: "cinematic" };
  if (t.includes("vintage") || t.includes("purana"))
    return { type: "SET_FILTER", filter: "vintage" };
  if (
    t.includes("black and white") ||
    t.includes("grayscale") ||
    t.includes("kala safed")
  ) {
    return { type: "SET_FILTER", filter: "bw" };
  }
  if (t.includes("vivid") || t.includes("colorful") || t.includes("rangeen")) {
    return { type: "SET_FILTER", filter: "vivid" };
  }
  if (t.includes("warm") || t.includes("garam"))
    return { type: "SET_FILTER", filter: "warm" };
  if (t.includes("cool") || t.includes("thanda"))
    return { type: "SET_FILTER", filter: "cool" };
  if (t.includes("hdr")) return { type: "SET_FILTER", filter: "hdr" };

  // Special effects
  if (t.includes("blur") || t.includes("blurry"))
    return { type: "SET_SPECIAL_EFFECT", effect: "blur" };
  if (t.includes("glow") || t.includes("chamak"))
    return { type: "SET_SPECIAL_EFFECT", effect: "glow" };

  // Custom commands
  if (t.includes("neon text"))
    return { type: "CUSTOM", command: "ADD_NEON_TEXT" };
  if (t.includes("text add karo") || t.includes("add text"))
    return { type: "CUSTOM", command: "ADD_TEXT" };
  if (
    t.includes("sticker add karo") ||
    t.includes("add sticker") ||
    t.includes("sticker lagao")
  ) {
    return { type: "CUSTOM", command: "ADD_STICKER" };
  }
  if (
    t.includes("viral edit") ||
    t.includes("viral karo") ||
    t.includes("auto viral")
  ) {
    return { type: "CUSTOM", command: "AUTO_VIRAL" };
  }

  // Undo / Reset
  if (t.includes("undo karo") || t === "undo" || t.includes("wapas karo"))
    return { type: "UNDO" };
  if (t.includes("reset karo") || t === "reset" || t.includes("sab hatao"))
    return { type: "RESET" };

  // Before/After
  if (
    t.includes("before after") ||
    t.includes("compare") ||
    t.includes("pehle baad")
  ) {
    return { type: "TOGGLE_BEFORE_AFTER" };
  }

  // Transform
  if (t.includes("rotate") || t.includes("ghuma do"))
    return { type: "ROTATE_90", dir: "right" };
  if (t.includes("flip") || t.includes("ulta karo")) return { type: "FLIP_H" };

  return null;
}

type SpeechRecognitionType = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
};

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionType;
    webkitSpeechRecognition: new () => SpeechRecognitionType;
  }
}

export function useVoiceCommands({
  onCommand,
}: UseVoiceCommandsOptions): UseVoiceCommandsResult {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  const SpeechRecognitionCtor =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognitionCtor;

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      const action = parseTranscript(transcript);
      onCommand(action);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [SpeechRecognitionCtor, onCommand]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { isListening, isSupported, toggleListening };
}
