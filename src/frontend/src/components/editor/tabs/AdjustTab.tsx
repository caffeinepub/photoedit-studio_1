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
import { ChevronDown } from "lucide-react";
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
];

const CROP_ASPECTS = ["free", "1:1", "16:9", "4:3", "3:2"] as const;

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

  function handleAdjChange(key: keyof Adjustments, value: number[]) {
    dispatch({ type: "SET_ADJUSTMENT", key, value: value[0] });
  }

  return (
    <div className="px-3 py-2 space-y-1">
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
    </div>
  );
}
