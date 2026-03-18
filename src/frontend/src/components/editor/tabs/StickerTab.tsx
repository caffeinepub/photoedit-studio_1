import { Button } from "@/components/ui/button";
import { type StickerLayer, useEditor } from "@/contexts/EditorContext";
import { Trash2, Upload } from "lucide-react";
import { useRef } from "react";

const BUILTIN_STICKERS = [
  "😎",
  "🔥",
  "❤️",
  "🌟",
  "👑",
  "🎉",
  "💫",
  "🦋",
  "🌈",
  "💎",
  "🎨",
  "🚀",
];

export default function StickerTab() {
  const { state, dispatch } = useEditor();
  const fileRef = useRef<HTMLInputElement>(null);

  function addSticker(content: string, isCustom = false) {
    const newLayer: StickerLayer = {
      id: `sticker-${Date.now()}`,
      content,
      isCustom,
      x: 50,
      y: 50,
      size: 64,
    };
    dispatch({
      type: "SET_STICKER_LAYERS",
      layers: [...state.stickerLayers, newLayer],
    });
  }

  function removeSticker(id: string) {
    dispatch({
      type: "SET_STICKER_LAYERS",
      layers: state.stickerLayers.filter((l) => l.id !== id),
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) addSticker(ev.target.result as string, true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="px-3 py-3 space-y-4">
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Emoji Stickers
        </p>
        <div className="grid grid-cols-6 gap-1">
          {BUILTIN_STICKERS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addSticker(emoji)}
              className="w-full aspect-square flex items-center justify-center text-2xl rounded-md hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
              disabled={!state.imageUrl}
              data-ocid="sticker.button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full h-8 text-xs gap-1.5"
        onClick={() => fileRef.current?.click()}
        disabled={!state.imageUrl}
        data-ocid="sticker.upload_button"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload Custom Sticker
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {state.stickerLayers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Placed Stickers</p>
          {state.stickerLayers.map((layer, i) => (
            <div
              key={layer.id}
              className="flex items-center justify-between rounded-md px-2 py-1.5 bg-card border border-border"
              data-ocid={`sticker.item.${i + 1}`}
            >
              <div className="flex items-center gap-2">
                {layer.isCustom ? (
                  <img
                    src={layer.content}
                    alt="sticker"
                    className="w-7 h-7 rounded object-cover"
                  />
                ) : (
                  <span className="text-lg">{layer.content}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {layer.isCustom ? "Custom" : "Emoji"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeSticker(layer.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                data-ocid={`sticker.delete_button.${i + 1}`}
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
