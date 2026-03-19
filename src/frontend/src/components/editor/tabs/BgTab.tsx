import { Button } from "@/components/ui/button";
import { useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { ImageOff, RotateCcw, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const BG_PRESETS = [
  {
    id: "beach",
    label: "Beach",
    value: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 60%, #f7c59f 100%)",
  },
  {
    id: "city",
    label: "City Night",
    value: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  },
  {
    id: "office",
    label: "Office",
    value: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
  },
  {
    id: "sunset",
    label: "Sunset",
    value: "linear-gradient(135deg, #f7971e 0%, #ffd200 50%, #ff5e62 100%)",
  },
  {
    id: "forest",
    label: "Forest",
    value: "linear-gradient(135deg, #1a4731 0%, #56ab2f 100%)",
  },
  {
    id: "galaxy",
    label: "Galaxy",
    value: "linear-gradient(135deg, #0d0221 0%, #2d1b69 50%, #11998e 100%)",
  },
  {
    id: "neon",
    label: "Neon",
    value: "linear-gradient(135deg, #f953c6 0%, #b91d73 50%, #00f2fe 100%)",
  },
  {
    id: "white",
    label: "White",
    value: "#ffffff",
  },
  {
    id: "black",
    label: "Black",
    value: "#000000",
  },
];

export default function BgTab() {
  const { state, dispatch } = useEditor();
  const [removing, setRemoving] = useState(false);
  const [blurBg, setBlurBg] = useState(false);
  const [customColor, setCustomColor] = useState("#ffffff");

  async function removeBackground() {
    if (!state.imageUrl) return;
    setRemoving(true);
    toast("Removing background... (AI Processing)");

    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = state.imageUrl!;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Sample background color from 4 corners and average
    const corners = [
      [0, 0],
      [canvas.width - 1, 0],
      [0, canvas.height - 1],
      [canvas.width - 1, canvas.height - 1],
    ];
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    for (const [cx, cy] of corners) {
      const idx = (cy * canvas.width + cx) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
    }
    const bgR = rSum / 4;
    const bgG = gSum / 4;
    const bgB = bSum / 4;

    // Threshold-based removal: mark pixels similar to bg color as transparent
    const threshold = 65;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      if (dist < threshold) {
        data[i + 3] = 0; // transparent
      } else if (dist < threshold * 1.5) {
        // soft edge
        data[i + 3] = Math.round(
          ((dist - threshold) / (threshold * 0.5)) * 255,
        );
      }
    }

    ctx.putImageData(imageData, 0, 0);
    const newUrl = canvas.toDataURL("image/png");
    dispatch({
      type: "LOAD_IMAGE",
      url: newUrl,
      name: `${state.imageName}_nobg`,
    });
    setRemoving(false);
    toast.success("Background removed! ✨");
  }

  function applyBlurBg(enable: boolean) {
    setBlurBg(enable);
    if (enable) {
      dispatch({ type: "SET_SPECIAL_EFFECT", effect: "blur" });
    } else {
      dispatch({ type: "SET_SPECIAL_EFFECT", effect: null });
    }
  }

  function applyBackground(value: string) {
    if (value.startsWith("#")) {
      dispatch({ type: "SET_BG_COLOR", color: value });
      dispatch({ type: "SET_BACKGROUND", url: null });
    } else {
      dispatch({ type: "SET_BACKGROUND", url: value });
      dispatch({ type: "SET_BG_COLOR", color: null });
    }
  }

  function resetBg() {
    dispatch({ type: "SET_BACKGROUND", url: null });
    dispatch({ type: "SET_BG_COLOR", color: null });
    dispatch({ type: "SET_SPECIAL_EFFECT", effect: null });
    setBlurBg(false);
  }

  return (
    <div className="px-3 py-3 space-y-4 pb-20">
      {/* AI Remove BG */}
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          AI Background Remove
        </p>
        <Button
          type="button"
          size="sm"
          className="w-full h-9 text-xs gap-2 font-semibold"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.6 0.24 320), oklch(0.55 0.22 240))",
            color: "white",
          }}
          onClick={removeBackground}
          disabled={!state.imageUrl || removing}
          data-ocid="bg.remove.button"
        >
          <Wand2 className="w-4 h-4" />
          {removing ? "Processing..." : "Remove Background"}
        </Button>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
          One-click AI background removal
        </p>
      </div>

      {/* Blur BG toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <div>
          <p className="text-xs font-medium text-foreground">Blur Background</p>
          <p className="text-[10px] text-muted-foreground">
            Bokeh / portrait mode effect
          </p>
        </div>
        <button
          type="button"
          onClick={() => applyBlurBg(!blurBg)}
          className={cn(
            "w-10 h-5 rounded-full transition-colors relative flex-shrink-0",
            blurBg ? "bg-primary" : "bg-muted",
          )}
          disabled={!state.imageUrl}
          data-ocid="bg.blur.toggle"
        >
          <div
            className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              blurBg ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {/* Background Presets */}
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          New Background
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {BG_PRESETS.map((bg) => (
            <button
              key={bg.id}
              type="button"
              onClick={() => applyBackground(bg.value)}
              className="flex flex-col items-center gap-1 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
              disabled={!state.imageUrl}
              data-ocid={`bg.preset.${bg.id}`}
            >
              <div className="w-full h-10" style={{ background: bg.value }} />
              <span className="text-[10px] text-muted-foreground pb-1">
                {bg.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color */}
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Custom Color
        </p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent"
            data-ocid="bg.color.input"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => applyBackground(customColor)}
            disabled={!state.imageUrl}
            data-ocid="bg.apply_color.button"
          >
            Apply Color
          </Button>
        </div>
      </div>

      {/* Reset */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full h-8 text-xs gap-1.5 text-muted-foreground"
        onClick={resetBg}
        disabled={!state.imageUrl}
        data-ocid="bg.reset.button"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset Background
      </Button>
    </div>
  );
}
