import { Button } from "@/components/ui/button";
import { useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { Download, ImagePlus, Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type GridLayout =
  | "1x2"
  | "2x1"
  | "2x2"
  | "3x1"
  | "1x3"
  | "1x4"
  | "2x3"
  | "3x2"
  | "3x3";
type FrameStyle = "none" | "white" | "black" | "rounded" | "shadow";

const LAYOUTS: { id: GridLayout; label: string; cols: number; rows: number }[] =
  [
    { id: "1x2", label: "1×2", cols: 1, rows: 2 },
    { id: "2x1", label: "2×1", cols: 2, rows: 1 },
    { id: "2x2", label: "2×2", cols: 2, rows: 2 },
    { id: "3x1", label: "3×1", cols: 3, rows: 1 },
    { id: "1x3", label: "1×3", cols: 1, rows: 3 },
    { id: "1x4", label: "1×4", cols: 1, rows: 4 },
    { id: "2x3", label: "2×3", cols: 2, rows: 3 },
    { id: "3x2", label: "3×2", cols: 3, rows: 2 },
    { id: "3x3", label: "3×3", cols: 3, rows: 3 },
  ];

const FRAME_STYLES: { id: FrameStyle; label: string }[] = [
  { id: "none", label: "None" },
  { id: "white", label: "White" },
  { id: "black", label: "Black" },
  { id: "rounded", label: "Round" },
  { id: "shadow", label: "Shadow" },
];

const GAP = 4;
const CELL_SIZE = 110;

export default function CollageTab() {
  const { dispatch } = useEditor();
  const [layout, setLayout] = useState<GridLayout>("2x2");
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("none");
  const [photos, setPhotos] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeCell, setActiveCell] = useState<number | null>(null);

  const current = LAYOUTS.find((l) => l.id === layout)!;
  const totalCells = current.cols * current.rows;

  function handleCellClick(idx: number) {
    setActiveCell(idx);
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeCell === null) return;
    const url = URL.createObjectURL(file);
    setPhotos((prev) => {
      const next = [...prev];
      next[activeCell] = url;
      return next;
    });
    e.target.value = "";
    setActiveCell(null);
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  }

  function changeLayout(l: GridLayout) {
    setLayout(l);
    const found = LAYOUTS.find((x) => x.id === l)!;
    const newTotal = found.cols * found.rows;
    setPhotos(
      Array.from(
        { length: Math.max(newTotal, 4) },
        (_, i) => photos[i] ?? null,
      ),
    );
  }

  function getFrameStyle(frameId: FrameStyle): React.CSSProperties {
    switch (frameId) {
      case "white":
        return { border: "6px solid white" };
      case "black":
        return { border: "6px solid #111" };
      case "rounded":
        return { borderRadius: 12, overflow: "hidden" };
      case "shadow":
        return { boxShadow: "0 4px 16px rgba(0,0,0,0.5)" };
      default:
        return {};
    }
  }

  async function buildCollageCanvas(): Promise<HTMLCanvasElement | null> {
    const cols = current.cols;
    const rows = current.rows;
    const framePad = frameStyle !== "none" ? 6 : 0;
    const canvas = document.createElement("canvas");
    const canvasW = cols * CELL_SIZE + (cols + 1) * GAP;
    const canvasH = rows * CELL_SIZE + (rows + 1) * GAP;
    canvas.width = canvasW * 4;
    canvas.height = canvasH * 4;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(4, 4);

    // Background
    const bgColor =
      frameStyle === "white"
        ? "#ffffff"
        : frameStyle === "black"
          ? "#111111"
          : "#111";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const loadedPhotos = await Promise.all(
      Array.from({ length: totalCells }, (_, i) => {
        const url = photos[i];
        if (!url) return Promise.resolve(null);
        return new Promise<HTMLImageElement | null>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        });
      }),
    );

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const x = GAP + col * (CELL_SIZE + GAP);
        const y = GAP + row * (CELL_SIZE + GAP);
        const fx = x + framePad;
        const fy = y + framePad;
        const fw = CELL_SIZE - framePad * 2;
        const fh = CELL_SIZE - framePad * 2;

        ctx.fillStyle = "#222";
        if (frameStyle === "rounded") {
          ctx.beginPath();
          ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 8);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }

        const img = loadedPhotos[idx];
        if (img) {
          const aspect = img.naturalWidth / img.naturalHeight;
          let sx = 0;
          let sy = 0;
          let sw = img.naturalWidth;
          let sh = img.naturalHeight;
          if (aspect > 1) {
            sw = sh;
            sx = (img.naturalWidth - sw) / 2;
          } else {
            sh = sw;
            sy = (img.naturalHeight - sh) / 2;
          }

          if (frameStyle === "shadow") {
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(0,0,0,0.7)";
          }

          if (frameStyle === "rounded") {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(fx, fy, fw, fh, 6);
            ctx.clip();
            ctx.drawImage(img, sx, sy, sw, sh, fx, fy, fw, fh);
            ctx.restore();
          } else {
            ctx.drawImage(img, sx, sy, sw, sh, fx, fy, fw, fh);
          }

          ctx.shadowBlur = 0;

          // Frame border
          if (frameStyle === "white" || frameStyle === "black") {
            ctx.strokeStyle = frameStyle === "white" ? "#ffffff" : "#111111";
            ctx.lineWidth = framePad;
            ctx.strokeRect(
              x + framePad / 2,
              y + framePad / 2,
              CELL_SIZE - framePad,
              CELL_SIZE - framePad,
            );
          }
        }
      }
    }
    return canvas;
  }

  async function downloadCollage() {
    const canvas = await buildCollageCanvas();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "collage.png";
      a.click();
      toast.success("Collage downloaded!");
    });
  }

  async function loadCollageAsMain() {
    const canvas = await buildCollageCanvas();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    dispatch({ type: "LOAD_IMAGE", url: dataUrl, name: "collage" });
    toast.success("Collage loaded as main image!");
  }

  const hasAnyPhoto = photos.slice(0, totalCells).some((p) => !!p);

  return (
    <div className="px-3 py-3 space-y-4 pb-20">
      {/* Grid Layout */}
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Grid Layout
        </p>
        <div className="flex gap-1 flex-wrap">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => changeLayout(l.id)}
              className={cn(
                "px-2.5 py-1 rounded text-xs border transition-colors",
                layout === l.id
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
              data-ocid={`collage.${l.id}.tab`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Style */}
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Frame Style
        </p>
        <div className="flex gap-1">
          {FRAME_STYLES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFrameStyle(f.id)}
              className={cn(
                "flex-1 py-1.5 rounded text-[10px] border transition-colors",
                frameStyle === f.id
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
              data-ocid={`collage.frame.${f.id}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photos Grid */}
      <div>
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Photos ({photos.slice(0, totalCells).filter(Boolean).length}/
          {totalCells})
        </p>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${current.cols}, 1fr)` }}
          data-ocid="collage.canvas_target"
        >
          {Array.from({ length: totalCells }, (_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: grid cell order is significant
              key={i}
              className="relative aspect-square rounded overflow-hidden border border-border cursor-pointer group"
              style={{
                background: "oklch(0.20 0.02 222)",
                ...getFrameStyle(frameStyle),
              }}
              data-ocid={`collage.item.${i + 1}`}
            >
              {photos[i] ? (
                <>
                  <img
                    src={photos[i]!}
                    alt={`Collage cell ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    data-ocid={`collage.delete_button.${i + 1}`}
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCellClick(i)}
                  className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="collage.upload_button"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px]">{i + 1}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          type="button"
          size="sm"
          className="w-full h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
          onClick={loadCollageAsMain}
          disabled={!hasAnyPhoto}
          data-ocid="collage.load_main.button"
        >
          <ImagePlus className="w-3.5 h-3.5" />
          Open in Editor
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full h-8 text-xs gap-1.5"
          onClick={downloadCollage}
          disabled={!hasAnyPhoto}
          data-ocid="collage.primary_button"
        >
          <Download className="w-3.5 h-3.5" />
          Download Collage
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
