import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { type TextLayer, useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { Trash2, Type } from "lucide-react";
import { useState } from "react";

type FontStyle = TextLayer["fontStyle"];

const FONT_STYLES: { value: FontStyle; label: string; className: string }[] = [
  { value: "normal", label: "Normal", className: "font-normal" },
  { value: "bold", label: "Bold", className: "font-bold" },
  {
    value: "neon",
    label: "Neon",
    className: "font-bold",
  },
  {
    value: "glitch",
    label: "Glitch",
    className: "font-bold",
  },
];

export default function TextTab() {
  const { state, dispatch } = useEditor();
  const [text, setText] = useState("");
  const [fontStyle, setFontStyle] = useState<FontStyle>("normal");
  const [color, setColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(32);

  function addText() {
    if (!text.trim()) return;
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      text: text.trim(),
      fontStyle,
      color,
      fontSize,
      x: 50,
      y: 50,
    };
    dispatch({
      type: "SET_TEXT_LAYERS",
      layers: [...state.textLayers, newLayer],
    });
    setText("");
  }

  function removeText(id: string) {
    dispatch({
      type: "SET_TEXT_LAYERS",
      layers: state.textLayers.filter((l) => l.id !== id),
    });
  }

  return (
    <div className="px-3 py-3 space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          Text Content
        </Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text..."
          className="bg-input border-border text-xs h-8"
          data-ocid="text.input"
          onKeyDown={(e) => e.key === "Enter" && addText()}
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Font Style
        </Label>
        <div className="grid grid-cols-4 gap-1">
          {FONT_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setFontStyle(s.value)}
              className={cn(
                "h-8 rounded text-xs border transition-colors",
                fontStyle === s.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
                s.value === "neon" && "text-cyan-400",
                s.value === "glitch" && "text-red-400",
              )}
              data-ocid={`text.${s.value}.toggle`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Color
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
              data-ocid="text.color.input"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {color}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Size: {fontSize}px
          </Label>
          <Slider
            min={12}
            max={120}
            step={2}
            value={[fontSize]}
            onValueChange={(v) => setFontSize(v[0])}
            data-ocid="text.size.input"
          />
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        className="w-full h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
        onClick={addText}
        disabled={!text.trim() || !state.imageUrl}
        data-ocid="text.add_button"
      >
        <Type className="w-3.5 h-3.5" />
        Add Text to Canvas
      </Button>

      {state.textLayers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground block">
            Text Layers
          </Label>
          {state.textLayers.map((layer, i) => (
            <div
              key={layer.id}
              className="flex items-center justify-between rounded-md px-2 py-1.5 bg-card border border-border"
              data-ocid={`text.item.${i + 1}`}
            >
              <span
                className="text-xs truncate max-w-[160px]"
                style={{
                  color: layer.color,
                  fontWeight:
                    layer.fontStyle === "bold" ||
                    layer.fontStyle === "neon" ||
                    layer.fontStyle === "glitch"
                      ? "bold"
                      : "normal",
                  textShadow:
                    layer.fontStyle === "neon"
                      ? `0 0 8px ${layer.color}, 0 0 20px ${layer.color}`
                      : undefined,
                }}
              >
                {layer.text}
              </span>
              <button
                type="button"
                onClick={() => removeText(layer.id)}
                className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                data-ocid={`text.delete_button.${i + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
