import { Button } from "@/components/ui/button";
import {
  type StickerLayer,
  type TextLayer,
  useEditor,
} from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { ImagePlus, Minus, Plus, Upload, ZoomIn } from "lucide-react";
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

const FONT_FAMILY_MAP: Record<TextLayer["fontFamily"], string> = {
  default: "system-ui",
  poppins: "'Poppins', sans-serif",
  pacifico: "'Pacifico', cursive",
  orbitron: "'Orbitron', sans-serif",
  bebas: "'Bebas Neue', sans-serif",
  playfair: "'Playfair Display', serif",
};

const TEXT_ANIM_CLASS: Record<string, string> = {
  none: "",
  typing: "text-anim-typing",
  glow: "text-anim-glow",
  bounce: "text-anim-bounce",
  fadein: "text-anim-fadein",
};

function TextOverlay({ layer }: { layer: TextLayer }) {
  const { state, dispatch } = useEditor();
  const [pos, setPos] = useState({ x: layer.x, y: layer.y });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement | null>(null);
  const elemRef = useRef<HTMLDivElement>(null);

  const isSelected =
    state.selectedLayerId === layer.id && state.selectedLayerType === "text";

  const getNeonStyle = (color: string): React.CSSProperties => ({
    textShadow: `0 0 7px ${color}, 0 0 21px ${color}, 0 0 42px ${color}`,
    color,
  });

  const getGlitchStyle = (color: string): React.CSSProperties => ({
    textShadow: "2px 0 #ff0000, -2px 0 #00ffff",
    color,
  });

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    dispatch({ type: "SET_SELECTED_LAYER", id: layer.id, layerType: "text" });
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

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "SET_SELECTED_LAYER", id: layer.id, layerType: "text" });
    dragging.current = true;
    const parent = (e.currentTarget as HTMLElement).parentElement;
    if (!parent) return;
    containerRef.current = parent;
    const rect = parent.getBoundingClientRect();
    const touch = e.touches[0];
    offset.current = {
      x: touch.clientX - (pos.x / 100) * rect.width,
      y: touch.clientY - (pos.y / 100) * rect.height,
    };
    const onTouchMove = (ev: TouchEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const t = ev.touches[0];
      setPos({
        x: Math.max(
          0,
          Math.min(100, ((t.clientX - offset.current.x) / r.width) * 100),
        ),
        y: Math.max(
          0,
          Math.min(100, ((t.clientY - offset.current.y) / r.height) * 100),
        ),
      });
    };
    const onTouchEnd = () => {
      dragging.current = false;
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  }

  const fontFamily = FONT_FAMILY_MAP[layer.fontFamily ?? "default"];
  const rotation = layer.rotation ?? 0;
  const scale = layer.scale ?? 1;
  const animClass = TEXT_ANIM_CLASS[layer.textAnimation ?? "none"] ?? "";

  // Determine font weight based on style
  const fontWeight: React.CSSProperties["fontWeight"] =
    layer.fontStyle === "normal" ? "normal" : "bold";

  // Outer wrapper: handles positioning ONLY — no text styling here
  // so animation keyframes on inner span don't fight the translate(-50%,-50%)
  const wrapperStyle: React.CSSProperties = {
    position: "absolute",
    left: `${pos.x}%`,
    top: `${pos.y}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
    cursor: "move",
    userSelect: "none",
    touchAction: "none",
    outline: isSelected ? "2px dashed rgba(79,158,255,0.8)" : undefined,
    outlineOffset: isSelected ? "4px" : undefined,
  };

  // Inner span: all text visual styles + animation class
  const innerStyle: React.CSSProperties = {
    display: "inline-block",
    whiteSpace: "nowrap",
    fontSize: layer.fontSize,
    color: layer.color,
    fontFamily,
    fontWeight,
    textAlign: layer.align ?? "center",
    letterSpacing: layer.letterSpacing ? `${layer.letterSpacing}px` : undefined,
    ...(layer.fontStyle === "neon" ? getNeonStyle(layer.color) : {}),
    ...(layer.fontStyle === "glitch" ? getGlitchStyle(layer.color) : {}),
    ...(layer.fontStyle === "gradient"
      ? {
          background: "linear-gradient(45deg, red, blue)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
        }
      : {}),
    ...(layer.fontStyle === "shadow"
      ? { textShadow: "2px 2px 5px black" }
      : {}),
    ...(layer.fontStyle === "stroke" ? { WebkitTextStroke: "1px black" } : {}),
    ...(layer.fontStyle === "text3d"
      ? { textShadow: "2px 2px 0 #000, 4px 4px 0 #555" }
      : {}),
  };

  // Compute pixel position for handles (approx)
  const handlePos = { x: `${pos.x}%`, y: `${pos.y}%` };

  return (
    <>
      <div
        ref={elemRef}
        style={wrapperStyle}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Inner span receives animation class + all text styles */}
        <span style={innerStyle} className={animClass}>
          {layer.text}
        </span>
      </div>
      {isSelected && (
        <>
          {/* Resize handle: bottom-right corner increases font size */}
          <div
            style={{
              position: "absolute",
              left: handlePos.x,
              top: handlePos.y,
              width: 12,
              height: 12,
              background: "white",
              border: "2px solid #333",
              borderRadius: 2,
              transform: `translate(${layer.fontSize / 2}px, ${layer.fontSize / 2}px)`,
              cursor: "se-resize",
              zIndex: 30,
              touchAction: "none",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              let startX = e.clientX;
              const startSize = layer.fontSize;
              const onMove = (ev: PointerEvent) => {
                const delta = ev.clientX - startX;
                const newSize = Math.max(
                  8,
                  Math.min(200, startSize + delta * 0.5),
                );
                dispatch({
                  type: "UPDATE_TEXT_LAYER",
                  id: layer.id,
                  changes: { fontSize: newSize },
                });
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          />
          {/* Rotate handle */}
          <div
            style={{
              position: "absolute",
              left: handlePos.x,
              top: handlePos.y,
              width: 14,
              height: 14,
              background: "#4f9eff",
              border: "2px solid white",
              borderRadius: "50%",
              transform: `translate(-50%, -${layer.fontSize / 2 + 20}px)`,
              cursor: "crosshair",
              zIndex: 31,
              touchAction: "none",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              const parent = (e.currentTarget as HTMLElement).parentElement;
              if (!parent) return;
              const rect = parent.getBoundingClientRect();
              const cx = rect.left + (pos.x / 100) * rect.width;
              const cy = rect.top + (pos.y / 100) * rect.height;
              const onMove = (ev: PointerEvent) => {
                const angle =
                  (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) /
                    Math.PI +
                  90;
                dispatch({
                  type: "UPDATE_TEXT_LAYER",
                  id: layer.id,
                  changes: { rotation: angle },
                });
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          />
        </>
      )}
    </>
  );
}

function StickerOverlay({ layer }: { layer: StickerLayer }) {
  const { state, dispatch } = useEditor();
  const [pos, setPos] = useState({ x: layer.x, y: layer.y });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement | null>(null);

  const isSelected =
    state.selectedLayerId === layer.id && state.selectedLayerType === "sticker";

  const rotation = layer.rotation ?? 0;
  const scale = layer.scale ?? 1;
  const displaySize = layer.size * scale;

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    dispatch({
      type: "SET_SELECTED_LAYER",
      id: layer.id,
      layerType: "sticker",
    });
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

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: "SET_SELECTED_LAYER",
      id: layer.id,
      layerType: "sticker",
    });
    if (e.touches.length === 1) {
      dragging.current = true;
      const parent = (e.currentTarget as HTMLElement).parentElement;
      if (!parent) return;
      containerRef.current = parent;
      const rect = parent.getBoundingClientRect();
      const touch = e.touches[0];
      offset.current = {
        x: touch.clientX - (pos.x / 100) * rect.width,
        y: touch.clientY - (pos.y / 100) * rect.height,
      };
      const onTouchMove = (ev: TouchEvent) => {
        if (!dragging.current || !containerRef.current) return;
        if (ev.touches.length === 1) {
          const r = containerRef.current.getBoundingClientRect();
          const t = ev.touches[0];
          setPos({
            x: Math.max(
              0,
              Math.min(100, ((t.clientX - offset.current.x) / r.width) * 100),
            ),
            y: Math.max(
              0,
              Math.min(100, ((t.clientY - offset.current.y) / r.height) * 100),
            ),
          });
        }
      };
      const onTouchEnd = () => {
        dragging.current = false;
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
      };
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
    }
  }

  const handlePos = { x: `${pos.x}%`, y: `${pos.y}%` };

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          fontSize: displaySize,
          cursor: "move",
          userSelect: "none",
          lineHeight: 1,
          touchAction: "none",
          outline: isSelected ? "2px dashed rgba(79,158,255,0.8)" : undefined,
          outlineOffset: isSelected ? "4px" : undefined,
        }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {layer.isCustom ? (
          <img
            src={layer.content}
            alt="Custom sticker"
            style={{
              width: displaySize,
              height: displaySize,
              objectFit: "contain",
            }}
            draggable={false}
          />
        ) : (
          layer.content
        )}
      </div>
      {isSelected && (
        <>
          {/* SE resize handle */}
          <div
            style={{
              position: "absolute",
              left: handlePos.x,
              top: handlePos.y,
              width: 12,
              height: 12,
              background: "white",
              border: "2px solid #333",
              borderRadius: 2,
              transform: `translate(${displaySize / 2}px, ${displaySize / 2}px)`,
              cursor: "se-resize",
              zIndex: 30,
              touchAction: "none",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              const startX = e.clientX;
              const startSize = displaySize;
              const onMove = (ev: PointerEvent) => {
                const delta = ev.clientX - startX;
                const newSize = Math.max(20, Math.min(400, startSize + delta));
                dispatch({
                  type: "UPDATE_STICKER_LAYER",
                  id: layer.id,
                  changes: { size: newSize },
                });
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          />
          {/* NW resize handle */}
          <div
            style={{
              position: "absolute",
              left: handlePos.x,
              top: handlePos.y,
              width: 12,
              height: 12,
              background: "white",
              border: "2px solid #333",
              borderRadius: 2,
              transform: `translate(-${displaySize / 2 + 6}px, -${displaySize / 2 + 6}px)`,
              cursor: "nw-resize",
              zIndex: 30,
              touchAction: "none",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              const startX = e.clientX;
              const startSize = displaySize;
              const onMove = (ev: PointerEvent) => {
                const delta = startX - ev.clientX;
                const newSize = Math.max(20, Math.min(400, startSize + delta));
                dispatch({
                  type: "UPDATE_STICKER_LAYER",
                  id: layer.id,
                  changes: { size: newSize },
                });
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          />
          {/* Rotate handle */}
          <div
            style={{
              position: "absolute",
              left: handlePos.x,
              top: handlePos.y,
              width: 14,
              height: 14,
              background: "#4f9eff",
              border: "2px solid white",
              borderRadius: "50%",
              transform: `translate(-50%, -${displaySize / 2 + 24}px)`,
              cursor: "crosshair",
              zIndex: 31,
              touchAction: "none",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              const parent = (e.currentTarget as HTMLElement).parentElement;
              if (!parent) return;
              const rect = parent.getBoundingClientRect();
              const cx = rect.left + (pos.x / 100) * rect.width;
              const cy = rect.top + (pos.y / 100) * rect.height;
              const onMove = (ev: PointerEvent) => {
                const angle =
                  (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) /
                    Math.PI +
                  90;
                dispatch({
                  type: "UPDATE_STICKER_LAYER",
                  id: layer.id,
                  changes: { rotation: angle },
                });
              };
              const onUp = () => {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
          />
        </>
      )}
    </>
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
  // Refs for fit-to-view calculation
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const editingImgRef = useRef<HTMLImageElement>(null);
  // Pinch zoom tracking
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (url) {
        dispatch({
          type: "LOAD_IMAGE",
          url,
          name: file.name.replace(/\.[^.]+$/, ""),
        });
      }
    };
    reader.readAsDataURL(file);
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

  // Pinch zoom handlers
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pinchRef.current = { dist, zoom: state.zoom };
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newZoom = Math.max(
        0.25,
        Math.min(5, (pinchRef.current.zoom * dist) / pinchRef.current.dist),
      );
      dispatch({ type: "SET_ZOOM", zoom: newZoom });
    }
  }

  function handleTouchEnd() {
    if (pinchRef.current) pinchRef.current = null;
  }

  // Click on canvas background deselects
  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      dispatch({ type: "SET_SELECTED_LAYER", id: null, layerType: null });
    }
  }

  function handleFitToView() {
    const container = canvasContainerRef.current;
    const img = editingImgRef.current;
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) {
      dispatch({ type: "SET_ZOOM", zoom: 1 });
      return;
    }
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const zoom = Math.min(
      (containerW - 32) / img.naturalWidth,
      (containerH - 24) / img.naturalHeight,
      1,
    );
    dispatch({ type: "SET_ZOOM", zoom: Math.max(0.1, zoom) });
  }

  const filterStr = buildFilterString(
    state.adjustments,
    state.activeFilter,
    state.specialEffect,
  );
  const imgTransform = [
    `rotate(${state.rotation}deg)`,
    state.flipH ? "scaleX(-1)" : "",
    state.flipV ? "scaleY(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const zoomPercent = Math.round(state.zoom * 100);

  return (
    <div
      ref={canvasContainerRef}
      className="flex-1 relative overflow-hidden dot-grid"
      style={{ backgroundColor: "oklch(0.13 0.016 222)" }}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCanvasClick}
      onKeyDown={(e) =>
        e.key === "Escape" &&
        dispatch({ type: "SET_SELECTED_LAYER", id: null, layerType: null })
      }
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
                className="relative select-none canvas-relative"
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
                {(state.backgroundUrl || state.bgColor) && (
                  <div
                    className="absolute inset-0 rounded"
                    style={{
                      background: state.backgroundUrl ?? undefined,
                      backgroundColor:
                        !state.backgroundUrl && state.bgColor
                          ? state.bgColor
                          : undefined,
                      zIndex: 0,
                    }}
                  />
                )}
                <img
                  ref={editingImgRef}
                  src={state.imageUrl}
                  alt="Editing"
                  className="max-w-full max-h-full block shadow-2xl relative"
                  style={{
                    filter: filterStr || "none",
                    transform: imgTransform || "none",
                    maxWidth: "calc(100vw - 340px)",
                    maxHeight: "calc(100vh - 180px)",
                    userSelect: "none",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                  draggable={false}
                />

                {/* Vignette overlay on canvas */}
                {state.adjustments.vignette > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at center, transparent ${100 - state.adjustments.vignette}%, rgba(0,0,0,${state.adjustments.vignette / 150}) 100%)`,
                      zIndex: 2,
                    }}
                  />
                )}

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
              <label
                htmlFor="canvas-file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: "oklch(0.25 0.022 222)",
                  color: "oklch(0.93 0.01 220)",
                  border: "1px solid oklch(0.28 0.022 222)",
                }}
                data-ocid="canvas.upload_label"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zoom Controls */}
      {state.imageUrl && (
        <div
          className="absolute bottom-4 right-4 z-20 flex items-center gap-0 rounded-full border border-border overflow-hidden shadow-lg"
          style={{ background: "oklch(0.19 0.022 222)" }}
          data-ocid="canvas.zoom_controls"
        >
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "SET_ZOOM", zoom: state.zoom - 0.25 })
            }
            disabled={state.zoom <= 0.25}
            className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
            aria-label="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_ZOOM", zoom: 1 })}
            className="flex items-center justify-center px-2 h-8 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors min-w-[44px] border-x border-border"
            aria-label="Reset zoom"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "SET_ZOOM", zoom: state.zoom + 0.25 })
            }
            disabled={state.zoom >= 4}
            className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-40"
            aria-label="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFitToView}
            className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l border-border"
            aria-label="Fit to view"
            title="Fit to view"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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

      {/* File input */}
      <input
        ref={fileInputRef}
        id="canvas-file-upload"
        type="file"
        accept="image/*"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
        onChange={handleFileInput}
      />
    </div>
  );
}
