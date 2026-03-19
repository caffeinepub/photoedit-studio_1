import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VoiceAction } from "@/hooks/useVoiceCommands";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface VoiceCommandButtonProps {
  onCommand: (action: VoiceAction | null) => void;
}

export default function VoiceCommandButton({
  onCommand,
}: VoiceCommandButtonProps) {
  const { isListening, isSupported, toggleListening } = useVoiceCommands({
    onCommand,
  });

  if (!isSupported) return null;

  return (
    <div className="relative flex items-center justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleListening}
            className={cn(
              "relative w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200",
              isListening
                ? "border-red-500 bg-red-500/20 animate-pulse"
                : "border-border bg-card/40 hover:bg-card/70 hover:border-primary/50",
            )}
            data-ocid="voice_command.toggle"
            aria-label={
              isListening
                ? "Bol raha hun... (tap to stop)"
                : "Voice se edit karo"
            }
          >
            {isListening ? (
              <MicOff className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isListening
            ? "Bol raha hun... (tap to stop)"
            : "Voice se edit karo 🎤"}
        </TooltipContent>
      </Tooltip>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Listening...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
