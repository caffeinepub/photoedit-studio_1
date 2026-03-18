import { Button } from "@/components/ui/button";
import {
  type StickerLayer,
  type TextLayer,
  useEditor,
} from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { ImagePlus, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import BeforeAfterSlider from "./BeforeAfterSlider";

const RULER_TICKS = Array.from({ length: 20 }, (_, i) => i);
const CROP_CORNERS: [number, number][] = [
  [0, 0],
  [100, 0],
  [0, 100],
  [100, 100],
];
const GRID_CELLS = Array.from({ length: 9 }, (_, i) => i);

function TextOverlay({ layer }: { layer: TextLayer }) {
  const [pos, setPos] = useState({ x: layer.x, y: layer.y });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement | null>(null);

  const getNeonStyle = (color: string) => ({
    textShadow: `0 0 7px ${color}, 0 0 21px ${color}, 0 0 42px ${color}`,
  });

  const getGlitchStyle = (color: string): React.CSSProperties => ({
    textShadow: "2px 0 #ff0000, -2px 0 #00ffff",
    color,
  });

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    dragging.current = true;
    const parent = (e.currentTarget as HTMLElement).parentElement;
    if (!parent) return;
    containerRef.current = parent;
    const rect = parent.getBoundingClientRect();
    offset.current = {
      x: e.clientX - (pos.x / 100) * rect.width,
      y: e.clientY - (pos.y / 100) * rect.height,
    };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setPos({
        x: Math.max(
          0,
          Math.min(100, ((ev.clientX - offset.current.x) / r.width) * 100),
        ),
        y: Math.max(
          0,
          Math.min(100, ((ev.clientY - offset.current.y) / r.height) * 100),
        ),
      });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${pos.x}%`,
    top: `${pos.y}%`,
    transform: "translate(-50%, -50%)",
    fontSize: layer.fontSize,
    color: layer.color,
    cursor: "move",
    userSelect: "none",
    whiteSpace: "nowrap",
    fontWeight: layer.fontStyle !== "normal" ? "bold" : "normal",
    ...(layer.fontStyle === "neon" ? getNeonStyle(layer.color) : {}),
    ...(layer.fontStyle === "glitch" ? getGlitchStyle(layer.color) : {}),
  };

  return (
    <div style={baseStyle} onMouseDown={onMouseDown}>
      {layer.text}
    </div>
  );
}

function StickerOverlay({ layer }: { layer: StickerLayer }) {
  const [pos, setPos] = useState({ x: layer.x, y: layer.y });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement | null>(null);

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    dragging.current = true;
    const parent = (e.currentTarget as HTMLElement).parentElement;
    if (!parent) return;
    containerRef.current = parent;
    const rect = parent.getBoundingClientRect();
    offset.current = {
      x: e.clientX - (pos.x / 100) * rect.width,
      y: e.clientY - (pos.y / 100) * rect.height,
    };
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setPos({
        x: Math.max(
          0,
          Math.min(100, ((ev.clientX - offset.current.x) / r.width) * 100),
        ),
        y: Math.max(
          0,
          Math.min(100, ((ev.clientY - offset.current.y) / r.height) * 100),
        ),
      });
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        fontSize: layer.size,
        cursor: "move",
        userSelect: "none",
        lineHeight: 1,
      }}
      onMouseDown={onMouseDown}
    >
      {layer.isCustom ? (
        <img
          src={layer.content}
          alt="Custom sticker"
          style={{
            width: layer.size,
            height: layer.size,
            objectFit: "contain",
          }}
          draggable={false}
        />
      ) : (
        layer.content
      )}
    </div>
  );
}

export default function CanvasStage() {
  const { state, dispatch, buildFilterString } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const imgContainerRef = useRef<HTMLDivElement>(null);

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    dispatch({
      type: "LOAD_IMAGE",
      url,
      name: file.name.replace(/\.[^.]+$/, ""),
    });
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  const handleCropMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (state.activeTool !== "crop" || !imgContainerRef.current) return;
      const rect = imgContainerRef.current.getBoundingClientRect();
      setCropStart({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
      dispatch({ type: "SET_CROP_RECT", rect: null });
    },
    [state.activeTool, dispatch],
  );

  const handleCropMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cropStart || state.activeTool !== "crop" || !imgContainerRef.current)
        return;
      const rect = imgContainerRef.current.getBoundingClientRect();
      const x2 = ((e.clientX - rect.left) / rect.width) * 100;
      const y2 = ((e.clientY - rect.top) / rect.height) * 100;
      const x = Math.min(cropStart.x, x2);
      const y = Math.min(cropStart.y, y2);
      const w = Math.abs(x2 - cropStart.x);
      const h = Math.abs(y2 - cropStart.y);
      dispatch({ type: "SET_CROP_RECT", rect: { x, y, w, h } });
    },
    [cropStart, state.activeTool, dispatch],
  );

  const handleCropMouseUp = useCallback(() => {
    setCropStart(null);
    if (state.cropRect && (state.cropRect.w < 2 || state.cropRect.h < 2)) {
      dispatch({ type: "SET_CROP_RECT", rect: null });
    }
  }, [state.cropRect, dispatch]);

  const applyCrop = useCallback(() => {
    if (!state.imageUrl || !state.cropRect) return;
    const img = new Image();
    img.onload = () => {
      const { x, y, w, h } = state.cropRect!;
      const canvas = document.createElement("canvas");
      const cropW = Math.round((w / 100) * img.naturalWidth);
      const cropH = Math.round((h / 100) * img.naturalHeight);
      const cropX = Math.round((x / 100) * img.naturalWidth);
      const cropY = Math.round((y / 100) * img.naturalHeight);
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      const newUrl = canvas.toDataURL("image/png");
      dispatch({ type: "APPLY_CROP", url: newUrl });
    };
    img.src = state.imageUrl;
  }, [state.imageUrl, state.cropRect, dispatch]);

  const filterStr = buildFilterString(state.adjustments, state.activeFilter);
  const imgTransform = [
    `rotate(${state.rotation}deg)`,
    state.flipH ? "scaleX(-1)" : "",
    state.flipV ? "scaleY(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="flex-1 relative overflow-hidden dot-grid"
      style={{ backgroundColor: "oklch(0.13 0.016 222)" }}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      data-ocid="canvas.canvas_target"
    >
      {/* Rulers */}
      {state.imageUrl && (
        <>
          <div
            className="absolute top-0 left-8 right-0 h-6 border-b border-border ruler-h z-10 flex items-end pb-0.5"
            style={{ background: "oklch(0.19 0.022 222)" }}
            role="presentation"
          >
            {RULER_TICKS.map((i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static ruler ticks
              <div
                key={i}
                className="flex-1 border-l border-border/40 text-[8px] text-muted-foreground/50 pl-0.5"
              >
                {i * 50}
              </div>
            ))}
          </div>
          <div
            className="absolute top-6 left-0 bottom-0 w-8 border-r border-border ruler-v z-10 flex flex-col"
            style={{ background: "oklch(0.19 0.022 222)" }}
            role="presentation"
          >
            {RULER_TICKS.map((i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static ruler ticks
              <div
                key={i}
                className="flex-1 border-t border-border/40 text-[8px] text-muted-foreground/50 pt-0.5 pl-0.5 leading-none"
              >
                {i * 50}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Canvas content */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          state.imageUrl ? "top-6 left-8" : "",
        )}
        style={{
          cursor: state.activeTool === "crop" ? "crosshair" : "default",
        }}
      >
        <AnimatePresence mode="wait">
          {state.imageUrl ? (
            state.showBeforeAfter ? (
              <motion.div
                key="beforeafter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <BeforeAfterSlider />
              </motion.div>
            ) : (
              <motion.div
                key="image"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative select-none"
                ref={imgContainerRef}
                style={{
                  transform: `scale(${state.zoom})`,
                  transformOrigin: "center center",
                }}
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
              >
                {/* Background layer */}
                {state.backgroundUrl && (
                  <div
                    className="absolute inset-0 rounded"
                    style={{ background: state.backgroundUrl, zIndex: 0 }}
                  />
                )}
                <img
                  src={state.imageUrl}
                  alt="Editing"
                  className="max-w-full max-h-full block shadow-2xl relative"
                  style={{
                    filter: filterStr || "none",
                    transform: imgTransform || "none",
                    maxWidth: "calc(100vw - 400px)",
                    maxHeight: "calc(100vh - 120px)",
                    userSelect: "none",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                  draggable={false}
                />

                {/* Text overlays */}
                {state.textLayers.map((layer) => (
                  <TextOverlay key={layer.id} layer={layer} />
                ))}

                {/* Sticker overlays */}
                {state.stickerLayers.map((layer) => (
                  <StickerOverlay key={layer.id} layer={layer} />
                ))}

                {/* Crop overlay */}
                {state.isCropping && state.cropRect && (
                  <div
                    className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
                    style={{
                      left: `${state.cropRect.x}%`,
                      top: `${state.cropRect.y}%`,
                      width: `${state.cropRect.w}%`,
                      height: `${state.cropRect.h}%`,
                      zIndex: 10,
                    }}
                  >
                    <div
                      className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none"
                      role="presentation"
                    >
                      {GRID_CELLS.map((i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: static grid cells
                        <div key={i} className="border border-primary/20" />
                      ))}
                    </div>
                    {CROP_CORNERS.map(([x, y]) => (
                      <div
                        key={`${x}-${y}`}
                        className="absolute w-3 h-3 bg-primary rounded-sm"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    ))}
                  </div>
                )}
                {state.isCropping && state.cropRect && (
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-primary text-primary-foreground text-xs h-7"
                      onClick={applyCrop}
                      data-ocid="canvas.crop.confirm_button"
                    >
                      Apply Crop
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="text-xs h-7"
                      onClick={() => {
                        dispatch({ type: "SET_CROP_RECT", rect: null });
                        dispatch({ type: "SET_TOOL", tool: "select" });
                      }}
                      data-ocid="canvas.crop.cancel_button"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </motion.div>
            )
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex flex-col items-center justify-center gap-5 rounded-xl border-2 border-dashed px-16 py-14 transition-colors",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-muted-foreground/50",
              )}
              data-ocid="canvas.dropzone"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <ImagePlus className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-1">
                  Drop your image here
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP, GIF up to 50MB
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="gap-2 text-sm"
                onClick={() => fileInputRef.current?.click()}
                data-ocid="canvas.upload_button"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/5 border-2 border-primary border-dashed z-20 flex items-center justify-center"
          >
            <p className="text-primary font-medium text-lg">
              Drop to open image
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
