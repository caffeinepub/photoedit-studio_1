import { Button } from "@/components/ui/button";
import { useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { Crown, Lock, Plus, Trash2, Video } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type Transition = "fade" | "zoom" | "slide";

const PHOTO_KEYS = ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7"];

export default function ReelTab() {
  const { state, dispatch } = useEditor();
  const [photos, setPhotos] = useState<string[]>([]);
  const [duration, setDuration] = useState(2);
  const [transition, setTransition] = useState<Transition>("fade");
  const [isCreating, setIsCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = 8 - photos.length;
    const toAdd = files.slice(0, remaining);
    const urls = toAdd.map((f) => URL.createObjectURL(f));
    setPhotos((prev) => [...prev, ...urls]);
    e.target.value = "";
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function createReel() {
    if (photos.length === 0) return;
    setIsCreating(true);
    toast.success("Creating reel... This may take a moment.");
    try {
      const CANVAS_W = 1080;
      const CANVAS_H = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const ctx = canvas.getContext("2d")!;

      // @ts-ignore
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8",
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const loadedImages = await Promise.all(
        photos.map(
          (url) =>
            new Promise<HTMLImageElement>((resolve) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.src = url;
            }),
        ),
      );

      recorder.start();
      const FPS = 30;
      const frameDuration = duration * FPS;
      const transFrames = Math.min(15, frameDuration);

      for (let imgIdx = 0; imgIdx < loadedImages.length; imgIdx++) {
        const img = loadedImages[imgIdx];
        for (let frame = 0; frame < frameDuration; frame++) {
          const t = frame / frameDuration;
          ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

          const aspect = img.naturalWidth / img.naturalHeight;
          let sx = 0;
          let sy = 0;
          let sw = img.naturalWidth;
          let sh = img.naturalHeight;
          const tplAspect = CANVAS_W / CANVAS_H;
          if (aspect > tplAspect) {
            sh = img.naturalHeight;
            sw = sh * tplAspect;
            sx = (img.naturalWidth - sw) / 2;
          } else {
            sw = img.naturalWidth;
            sh = sw / tplAspect;
            sy = (img.naturalHeight - sh) / 2;
          }

          if (transition === "fade") {
            const alpha =
              frame < transFrames
                ? frame / transFrames
                : frame > frameDuration - transFrames
                  ? (frameDuration - frame) / transFrames
                  : 1;
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
            ctx.globalAlpha = 1;
          } else if (transition === "zoom") {
            const scale = 1 + t * 0.1;
            const ox = (CANVAS_W - CANVAS_W * scale) / 2;
            const oy = (CANVAS_H - CANVAS_H * scale) / 2;
            ctx.drawImage(
              img,
              sx,
              sy,
              sw,
              sh,
              ox,
              oy,
              CANVAS_W * scale,
              CANVAS_H * scale,
            );
          } else {
            const offsetX =
              frame < transFrames
                ? (transFrames - frame) * (CANVAS_W / transFrames)
                : 0;
            ctx.drawImage(img, sx, sy, sw, sh, offsetX, 0, CANVAS_W, CANVAS_H);
          }

          await new Promise<void>((r) => setTimeout(r, 1000 / FPS));
        }
      }

      recorder.stop();
      await new Promise<void>((r) => {
        recorder.onstop = () => r();
      });

      const blob = new Blob(chunks, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "reel.webm";
      a.click();
      toast.success("Reel downloaded!");
    } catch (_err) {
      toast.error("Failed to create reel. Try a different browser.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="px-3 py-3 space-y-4 relative">
      {/* Premium lock overlay */}
      {!state.isPremium && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-lg"
          style={{
            background: "oklch(0.13 0.016 222 / 0.88)",
            backdropFilter: "blur(2px)",
          }}
          data-ocid="reel.modal"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.55 0.18 60)" }}
          >
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-bold text-foreground mb-1">
              Premium Feature
            </p>
            <p className="text-xs text-muted-foreground">
              Upgrade to create reels &amp; videos
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 text-xs h-8"
            style={{ background: "oklch(0.55 0.18 60)", color: "white" }}
            onClick={() => dispatch({ type: "SET_PREMIUM", value: true })}
            data-ocid="reel.confirm_button"
          >
            <Crown className="w-3.5 h-3.5" />
            Unlock Premium
          </Button>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Photos ({photos.length}/8)
          <span
            className="ml-2 text-[10px] normal-case font-normal px-1.5 py-0.5 rounded"
            style={{ background: "oklch(0.55 0.18 60)", color: "white" }}
          >
            <Crown className="w-2.5 h-2.5 inline mr-0.5" />
            PRO
          </span>
        </p>
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {photos.map((url, i) => (
            <div
              key={PHOTO_KEYS[i]}
              className="relative aspect-square rounded overflow-hidden border border-border group"
              data-ocid={`reel.item.${i + 1}`}
            >
              <img
                src={url}
                alt={`Slide ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                data-ocid={`reel.delete_button.${i + 1}`}
              >
                <Trash2 className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
          {photos.length < 8 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
              data-ocid="reel.upload_button"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">
            Duration/slide
          </p>
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDuration(s)}
                className={cn(
                  "flex-1 h-7 rounded text-xs border transition-colors",
                  duration === s
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-card text-muted-foreground",
                )}
                data-ocid="reel.duration.toggle"
              >
                {s}s
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <p className="text-[11px] text-muted-foreground mb-1">Transition</p>
          <div className="flex gap-1">
            {(["fade", "zoom", "slide"] as Transition[]).map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setTransition(tr)}
                className={cn(
                  "flex-1 h-7 rounded text-xs border transition-colors capitalize",
                  transition === tr
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-card text-muted-foreground",
                )}
                data-ocid={`reel.${tr}.toggle`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        className="w-full h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
        onClick={createReel}
        disabled={photos.length === 0 || isCreating}
        data-ocid="reel.primary_button"
      >
        {isCreating ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <Video className="w-3.5 h-3.5" />
        )}
        {isCreating ? "Creating..." : "Create Reel"}
      </Button>
    </div>
  );
}
