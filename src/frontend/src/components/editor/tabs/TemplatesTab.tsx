import { useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TEMPLATES = [
  {
    id: "yt_thumb",
    label: "YouTube Thumbnail",
    emoji: "▶️",
    w: 1280,
    h: 720,
    aspect: "16:9",
  },
  {
    id: "ig_post",
    label: "Instagram Post",
    emoji: "📸",
    w: 1080,
    h: 1080,
    aspect: "1:1",
  },
  {
    id: "ig_story",
    label: "Instagram Story",
    emoji: "📱",
    w: 1080,
    h: 1920,
    aspect: "9:16",
  },
  {
    id: "wa_dp",
    label: "WhatsApp DP",
    emoji: "💬",
    w: 512,
    h: 512,
    aspect: "1:1",
  },
  {
    id: "tw_header",
    label: "Twitter Header",
    emoji: "🐦",
    w: 1500,
    h: 500,
    aspect: "3:1",
  },
  {
    id: "fb_cover",
    label: "Facebook Cover",
    emoji: "📘",
    w: 851,
    h: 315,
    aspect: "~3:1",
  },
];

export default function TemplatesTab() {
  const { state, dispatch } = useEditor();

  function applyTemplate(t: (typeof TEMPLATES)[0]) {
    if (!state.imageUrl) {
      toast.error("Upload an image first");
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = t.w;
      canvas.height = t.h;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, t.w, t.h);

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const tplAspect = t.w / t.h;
      let sx: number;
      let sy: number;
      let sw: number;
      let sh: number;
      if (imgAspect > tplAspect) {
        sh = img.naturalHeight;
        sw = sh * tplAspect;
        sx = (img.naturalWidth - sw) / 2;
        sy = 0;
      } else {
        sw = img.naturalWidth;
        sh = sw / tplAspect;
        sx = 0;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, t.w, t.h);
      const newUrl = canvas.toDataURL("image/png");
      dispatch({ type: "LOAD_IMAGE", url: newUrl, name: t.label });
      toast.success(`Applied ${t.label} template (${t.w}×${t.h})`);
    };
    img.src = state.imageUrl;
  }

  return (
    <div className="px-3 py-3">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
        Templates
      </p>
      <div className="space-y-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTemplate(t)}
            disabled={!state.imageUrl}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all text-left",
              "border-border bg-card hover:border-primary hover:bg-primary/10",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
            data-ocid={`template.${t.id}.button`}
          >
            <span className="text-xl shrink-0">{t.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{t.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {t.w} × {t.h}px · {t.aspect}
              </p>
            </div>
            <div
              className="ml-auto shrink-0 rounded border border-border/60"
              style={{
                width: 32,
                height: Math.round(32 * (t.h / t.w)),
                background: "oklch(0.25 0.02 222)",
                minHeight: 10,
                maxHeight: 40,
              }}
            />
          </button>
        ))}
      </div>
      {!state.imageUrl && (
        <p
          className="text-xs text-muted-foreground text-center mt-4"
          data-ocid="template.empty_state"
        >
          Upload an image to apply a template
        </p>
      )}
    </div>
  );
}
