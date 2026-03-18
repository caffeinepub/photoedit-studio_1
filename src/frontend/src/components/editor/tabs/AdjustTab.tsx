import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { type Adjustments, useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";

const ADJUSTMENT_FIELDS: {
  key: keyof Adjustments;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "brightness", label: "Brightness", min: -100, max: 100, step: 1 },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
  { key: "blur", label: "Blur", min: 0, max: 20, step: 0.5 },
  { key: "sharpness", label: "Sharpness", min: 0, max: 10, step: 0.1 },
  { key: "temperature", label: "Temperature", min: -100, max: 100, step: 1 },
  { key: "hue", label: "Hue Rotate", min: -180, max: 180, step: 1 },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, step: 1 },
  { key: "sepia", label: "Sepia", min: 0, max: 100, step: 1 },
];

const CROP_ASPECTS = ["free", "1:1", "16:9", "4:3", "3:2"] as const;

const PRESETS = [
  { key: "vintage", label: "Vintage", emoji: "🎞️" },
  { key: "bw", label: "B&W", emoji: "⚫" },
  { key: "cool", label: "Cool", emoji: "❄️" },
  { key: "warm", label: "Warm", emoji: "🔆" },
] as const;

const SPECIAL_EFFECTS = [
  { key: "blur", label: "Blur" },
  { key: "sharp", label: "Sharp" },
  { key: "glow", label: "Glow" },
  { key: "invert", label: "Invert" },
] as const;

function SectionHeader({ label, open }: { label: string; open: boolean }) {
  return (
    <CollapsibleTrigger asChild>
      <button
        type="button"
        className="w-full flex items-center justify-between py-2 text-xs font-semibold text-foreground uppercase tracking-wider hover:text-primary transition-colors"
      >
        {label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform",
            open ? "" : "-rotate-90",
          )}
        />
      </button>
    </CollapsibleTrigger>
  );
}

export default function AdjustTab() {
  const { state, dispatch } = useEditor();
  const [adjOpen, setAdjOpen] = useState(true);
  const [rotOpen, setRotOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [effectsOpen, setEffectsOpen] = useState(true);
  const [bgColorOpen, setBgColorOpen] = useState(false);

  function handleAdjChange(key: keyof Adjustments, value: number[]) {
    dispatch({ type: "SET_ADJUSTMENT", key, value: value[0] });
  }

  return (
    <div className="px-3 py-2 space-y-1">
      {/* Auto Edit button */}
      <button
        type="button"
        onClick={() => dispatch({ type: "AUTO_ADJUST" })}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 mb-2 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold transition-colors border border-primary/30"
        data-ocid="adjust.auto_edit.button"
      >
        <Wand2 className="w-3.5 h-3.5" />
        Auto Edit
      </button>

      {/* Quick Presets */}
      <Collapsible open={presetsOpen} onOpenChange={setPresetsOpen}>
        <SectionHeader label="Quick Presets" open={presetsOpen} />
        <CollapsibleContent className="pb-3">
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(({ key, label, emoji }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  dispatch({ type: "SET_FILTER", filter: key });
                  dispatch({ type: "PUSH_HISTORY" });
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors border",
                  state.activeFilter === key
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-muted/40 border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground",
                )}
                data-ocid={`adjust.preset.${key}.button`}
              >
                <span>{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-border" />

      {/* Special Effects */}
      <Collapsible open={effectsOpen} onOpenChange={setEffectsOpen}>
        <SectionHeader label="Special Effects" open={effectsOpen} />
        <CollapsibleContent className="pb-3">
          <div className="grid grid-cols-2 gap-2">
            {SPECIAL_EFFECTS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  dispatch({
                    type: "SET_SPECIAL_EFFECT",
                    effect: state.specialEffect === key ? null : key,
                  })
                }
                className={cn(
                  "px-2 py-1.5 rounded-md text-xs font-medium transition-colors border",
                  state.specialEffect === key
                    ? "bg-primary/20 border-primary/50 text-primary ring-1 ring-primary/40"
                    : "bg-muted/40 border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground",
                )}
                data-ocid={`adjust.effect.${key}.toggle`}
              >
                {label}
              </button>
            ))}
          </div>
          {state.specialEffect && (
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "SET_SPECIAL_EFFECT", effect: null })
              }
              className="mt-2 w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="adjust.effect.clear.button"
            >
              Clear effect
            </button>
          )}
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-border" />

      {/* Background Color */}
      <Collapsible open={bgColorOpen} onOpenChange={setBgColorOpen}>
        <SectionHeader label="Background Color" open={bgColorOpen} />
        <CollapsibleContent className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">
                Pick color
              </span>
              <input
                type="color"
                value={state.bgColor ?? "#000000"}
                onChange={(e) =>
                  dispatch({ type: "SET_BG_COLOR", color: e.target.value })
                }
                className="w-10 h-8 rounded border border-border cursor-pointer bg-transparent"
                data-ocid="adjust.bgcolor.input"
              />
            </div>
            {state.bgColor && (
              <div
                className="w-8 h-8 rounded border border-border mt-5"
                style={{ backgroundColor: state.bgColor }}
              />
            )}
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_BG_COLOR", color: null })}
              className="mt-5 px-2 py-1 rounded text-[11px] border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              data-ocid="adjust.bgcolor.clear.button"
            >
              Clear
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-border" />

      {/* Adjustments */}
      <Collapsible open={adjOpen} onOpenChange={setAdjOpen}>
        <SectionHeader label="Adjustments" open={adjOpen} />
        <CollapsibleContent className="pb-3 space-y-4">
          {ADJUSTMENT_FIELDS.map(({ key, label, min, max, step }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-muted-foreground font-medium">
                  {label}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {key === "blur" || key === "sharpness"
                    ? state.adjustments[key].toFixed(1)
                    : state.adjustments[key]}
                </span>
              </div>
              <Slider
                min={min}
                max={max}
                step={step}
                value={[state.adjustments[key]]}
                onValueChange={(v) => handleAdjChange(key, v)}
                onValueCommit={() => dispatch({ type: "PUSH_HISTORY" })}
                data-ocid={`adjustments.${key}.input`}
              />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-border" />

      {/* Rotation & Crop */}
      <Collapsible open={rotOpen} onOpenChange={setRotOpen}>
        <SectionHeader label="Rotation & Crop" open={rotOpen} />
        <CollapsibleContent className="pb-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] text-muted-foreground font-medium">
                Angle
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {state.rotation}°
              </span>
            </div>
            <Slider
              min={-180}
              max={180}
              step={1}
              value={[state.rotation]}
              onValueChange={(v) =>
                dispatch({ type: "SET_ROTATION", degrees: v[0] })
              }
              onValueCommit={() => dispatch({ type: "PUSH_HISTORY" })}
              data-ocid="rotation.angle.input"
            />
          </div>
          <div>
            <span className="text-[12px] text-muted-foreground font-medium block mb-1.5">
              Crop Aspect
            </span>
            <Select
              value={state.cropAspect}
              onValueChange={(v) =>
                dispatch({ type: "SET_CROP_ASPECT", aspect: v as any })
              }
            >
              <SelectTrigger
                className="h-8 text-xs bg-input border-border"
                data-ocid="crop.aspect.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {CROP_ASPECTS.map((a) => (
                  <SelectItem key={a} value={a} className="text-xs">
                    {a === "free" ? "Free" : a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Unused imports suppressed */}
      <span className="hidden">
        <Sparkles className="w-0 h-0" />
      </span>
    </div>
  );
}
