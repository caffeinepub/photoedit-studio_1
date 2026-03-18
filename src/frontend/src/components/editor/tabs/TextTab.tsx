import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { type TextLayer, useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { Trash2, Type } from "lucide-react";
import { useState } from "react";

type FontStyle = TextLayer["fontStyle"];
type FontFamily = TextLayer["fontFamily"];

const FONT_FAMILIES: {
  value: FontFamily;
  label: string;
  fontFamily: string;
}[] = [
  { value: "default", label: "Default", fontFamily: "system-ui" },
  { value: "poppins", label: "Poppins", fontFamily: "'Poppins', sans-serif" },
  { value: "pacifico", label: "Pacifico", fontFamily: "'Pacifico', cursive" },
  {
    value: "orbitron",
    label: "Orbitron",
    fontFamily: "'Orbitron', sans-serif",
  },
  {
    value: "bebas",
    label: "Bebas Neue",
    fontFamily: "'Bebas Neue', sans-serif",
  },
  {
    value: "playfair",
    label: "Playfair",
    fontFamily: "'Playfair Display', serif",
  },
];

const FONT_STYLES: {
  value: FontStyle;
  label: string;
  preview: React.CSSProperties;
}[] = [
  { value: "normal", label: "Normal", preview: {} },
  { value: "bold", label: "Bold", preview: { fontWeight: "bold" } },
  {
    value: "neon",
    label: "Neon",
    preview: {
      color: "#fff",
      textShadow: "0 0 5px cyan, 0 0 10px cyan, 0 0 20px cyan",
    },
  },
  {
    value: "gradient",
    label: "Gradient",
    preview: {
      background: "linear-gradient(45deg, red, blue)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      fontWeight: "bold",
    },
  },
  {
    value: "shadow",
    label: "Shadow",
    preview: { textShadow: "2px 2px 5px black", color: "#fff" },
  },
  {
    value: "stroke",
    label: "Stroke",
    preview: {
      WebkitTextStroke: "1px black",
      color: "#fff",
      fontWeight: "bold",
    },
  },
  {
    value: "text3d",
    label: "3D",
    preview: {
      textShadow: "2px 2px 0 #000, 4px 4px 0 #555",
      color: "#fff",
      fontWeight: "bold",
    },
  },
  {
    value: "glitch",
    label: "Glitch",
    preview: { textShadow: "2px 0 #ff0000, -2px 0 #00ffff", color: "#fff" },
  },
];

export default function TextTab() {
  const { state, dispatch } = useEditor();
  const [text, setText] = useState("");
  const [fontStyle, setFontStyle] = useState<FontStyle>("normal");
  const [fontFamily, setFontFamily] = useState<FontFamily>("default");
  const [color, setColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(32);

  function addText() {
    if (!text.trim()) return;
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      text: text.trim(),
      fontStyle,
      fontFamily,
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

  const selectedFamily = FONT_FAMILIES.find((f) => f.value === fontFamily);

  return (
    <div className="px-3 py-3 space-y-4">
      {/* Text Input */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          Text Content
        </Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text..."
          className="bg-input border-border text-xs h-8"
          style={{ fontFamily: selectedFamily?.fontFamily }}
          data-ocid="text.input"
          onKeyDown={(e) => e.key === "Enter" && addText()}
        />
      </div>

      {/* Font Family */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Font Family
        </Label>
        <div className="grid grid-cols-3 gap-1">
          {FONT_FAMILIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFontFamily(f.value)}
              className={cn(
                "h-9 rounded text-xs border transition-colors px-1 truncate",
                fontFamily === f.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
              style={{ fontFamily: f.fontFamily }}
              data-ocid={`text.${f.value}.toggle`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font Style */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
          Text Effect
        </Label>
        <div className="grid grid-cols-4 gap-1">
          {FONT_STYLES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setFontStyle(s.value)}
              className={cn(
                "h-9 rounded text-xs border transition-colors",
                fontStyle === s.value
                  ? "border-primary bg-primary/20"
                  : "border-border bg-card hover:border-muted-foreground",
              )}
              style={{
                ...s.preview,
                fontSize: "11px",
              }}
              data-ocid={`text.${s.value}.toggle`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color & Size */}
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

      {/* Preview */}
      <div className="rounded border border-border bg-card/50 p-3 min-h-[48px] flex items-center justify-center overflow-hidden">
        {text.trim() ? (
          <span
            style={{
              fontFamily: selectedFamily?.fontFamily,
              fontSize: Math.min(fontSize, 36),
              color,
              ...(fontStyle === "neon"
                ? {
                    textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}`,
                  }
                : {}),
              ...(fontStyle === "gradient"
                ? {
                    background: "linear-gradient(45deg, red, blue)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: "bold",
                  }
                : {}),
              ...(fontStyle === "shadow"
                ? { textShadow: "2px 2px 5px black" }
                : {}),
              ...(fontStyle === "stroke"
                ? { WebkitTextStroke: "1px black", fontWeight: "bold" }
                : {}),
              ...(fontStyle === "text3d"
                ? {
                    textShadow: "2px 2px 0 #000, 4px 4px 0 #555",
                    fontWeight: "bold",
                  }
                : {}),
              ...(fontStyle === "glitch"
                ? { textShadow: "2px 0 #ff0000, -2px 0 #00ffff" }
                : {}),
              ...(fontStyle === "bold" ? { fontWeight: "bold" } : {}),
            }}
          >
            {text}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">Preview</span>
        )}
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

      {/* Text Layers */}
      {state.textLayers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground block">
            Text Layers
          </Label>
          {state.textLayers.map((layer, i) => {
            const layerFamily = FONT_FAMILIES.find(
              (f) => f.value === layer.fontFamily,
            );
            return (
              <div
                key={layer.id}
                className="flex items-center justify-between rounded-md px-2 py-1.5 bg-card border border-border"
                data-ocid={`text.item.${i + 1}`}
              >
                <span
                  className="text-xs truncate max-w-[160px]"
                  style={{
                    color: layer.color,
                    fontFamily: layerFamily?.fontFamily,
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
            );
          })}
        </div>
      )}
    </div>
  );
}
