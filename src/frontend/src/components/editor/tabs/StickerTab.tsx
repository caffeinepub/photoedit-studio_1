import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type StickerLayer, useEditor } from "@/contexts/EditorContext";
import { Search, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const BUILTIN_STICKERS = [
  { emoji: "😎", tags: ["cool", "sunglasses"] },
  { emoji: "🔥", tags: ["fire", "hot", "trending"] },
  { emoji: "❤️", tags: ["heart", "love", "red"] },
  { emoji: "🌟", tags: ["star", "shine", "gold"] },
  { emoji: "👑", tags: ["crown", "king", "queen", "royal"] },
  { emoji: "🎉", tags: ["party", "celebrate", "confetti"] },
  { emoji: "💫", tags: ["dizzy", "star", "sparkle"] },
  { emoji: "🦋", tags: ["butterfly", "nature"] },
  { emoji: "🌈", tags: ["rainbow", "colorful"] },
  { emoji: "💎", tags: ["diamond", "gem", "sparkle"] },
  { emoji: "🎨", tags: ["art", "paint", "creative"] },
  { emoji: "🚀", tags: ["rocket", "space", "launch"] },
  { emoji: "😍", tags: ["love", "heart eyes", "cute"] },
  { emoji: "🥰", tags: ["love", "hearts", "cute"] },
  { emoji: "😂", tags: ["funny", "laugh", "lol"] },
  { emoji: "🤣", tags: ["funny", "laugh", "rofl"] },
  { emoji: "✨", tags: ["sparkle", "magic", "shine"] },
  { emoji: "💯", tags: ["100", "perfect", "score"] },
  { emoji: "🏆", tags: ["trophy", "winner", "gold"] },
  { emoji: "⚡", tags: ["lightning", "electric", "power"] },
  { emoji: "🌺", tags: ["flower", "nature", "bloom"] },
  { emoji: "🎭", tags: ["drama", "theater", "mask"] },
  { emoji: "🌙", tags: ["moon", "night", "crescent"] },
  { emoji: "☀️", tags: ["sun", "sunny", "bright"] },
];

// Twemoji sticker images
const TWEMOJI_STICKERS = [
  {
    label: "😍 Heart Eyes",
    url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f60d.png",
  },
  {
    label: "🔥 Fire",
    url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f525.png",
  },
  {
    label: "😎 Cool",
    url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f60e.png",
  },
  {
    label: "😂 ROFL",
    url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f602.png",
  },
  {
    label: "🥰 Smiling",
    url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f970.png",
  },
  {
    label: "💯 100",
    url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4af.png",
  },
  {
    label: "✨ Sparkles",
    url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2728.png",
  },
];

interface GiphySticker {
  id: string;
  url: string;
  title: string;
}

const GIPHY_API_KEY = "dc6zaTOxFJmzC";

export default function StickerTab() {
  const { state, dispatch } = useEditor();
  const fileRef = useRef<HTMLInputElement>(null);
  const [giphyStickers, setGiphyStickers] = useState<GiphySticker[]>([]);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setGiphyLoading(true);
    fetch(
      `https://api.giphy.com/v1/stickers/trending?api_key=${GIPHY_API_KEY}&limit=12&rating=g`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          const items: GiphySticker[] = data.data.map(
            (item: Record<string, unknown>) => {
              const images = item.images as Record<
                string,
                Record<string, string>
              >;
              return {
                id: item.id as string,
                title: item.title as string,
                url:
                  images?.fixed_width_small?.url ||
                  images?.fixed_width?.url ||
                  "",
              };
            },
          );
          setGiphyStickers(items.filter((s) => s.url));
        }
      })
      .catch(() => {})
      .finally(() => setGiphyLoading(false));
  }, []);

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

  function addFloatingEmoji(emoji: string) {
    const span = document.createElement("span");
    span.innerText = emoji;
    span.className = "floating-emoji";
    span.style.left = `${Math.random() * 80 + 10}vw`;
    span.style.top = `${Math.random() * 40 + 30}vh`;
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 2100);
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

  const q = search.toLowerCase().trim();
  const filteredStickers = q
    ? BUILTIN_STICKERS.filter(
        (s) => s.tags.some((t) => t.includes(q)) || s.emoji.includes(q),
      )
    : BUILTIN_STICKERS;

  return (
    <div className="px-3 py-3 space-y-4 pb-20">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji (fire, love, star...)"
          className="pl-8 h-8 text-xs bg-input border-border"
          data-ocid="sticker.search_input"
        />
      </div>

      {/* Emoji Stickers */}
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Emoji Stickers {q && `(${filteredStickers.length})`}
        </p>
        <div className="grid grid-cols-6 gap-1">
          {filteredStickers.map(({ emoji }) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                addSticker(emoji);
                addFloatingEmoji(emoji);
              }}
              className="w-full aspect-square flex items-center justify-center text-2xl rounded-md hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
              disabled={!state.imageUrl}
              data-ocid="sticker.button"
            >
              {emoji}
            </button>
          ))}
          {filteredStickers.length === 0 && (
            <p className="col-span-6 text-xs text-muted-foreground text-center py-2">
              No emoji found for "{q}"
            </p>
          )}
        </div>
      </div>

      {/* Twemoji Image Stickers */}
      {!q && (
        <div>
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Image Stickers
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TWEMOJI_STICKERS.map((s) => (
              <button
                key={s.url}
                type="button"
                onClick={() => addSticker(s.url, true)}
                className="aspect-square flex items-center justify-center rounded-md hover:bg-muted/60 border border-transparent hover:border-border transition-colors p-1"
                disabled={!state.imageUrl}
                title={s.label}
                data-ocid="sticker.button"
              >
                <img
                  src={s.url}
                  alt={s.label}
                  className="w-10 h-10 object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Giphy Trending Stickers */}
      {!q && (
        <div>
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Trending GIFs (Giphy)
          </p>
          {giphyLoading ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Loading...
            </p>
          ) : giphyStickers.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {giphyStickers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addSticker(s.url, true)}
                  className="aspect-square overflow-hidden rounded-md hover:ring-2 hover:ring-primary border border-border transition-all"
                  disabled={!state.imageUrl}
                  title={s.title}
                  data-ocid="sticker.button"
                >
                  <img
                    src={s.url}
                    alt={s.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Giphy stickers load nahi hue
            </p>
          )}
        </div>
      )}

      {/* Upload Custom */}
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

      {/* Placed Stickers List */}
      {state.stickerLayers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Placed Stickers ({state.stickerLayers.length})
          </p>
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
