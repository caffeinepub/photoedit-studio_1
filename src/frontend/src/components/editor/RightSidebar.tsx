import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildFilterString, useEditor } from "@/contexts/EditorContext";
import { Download, Loader2, Redo2, RotateCcw, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AdjustTab from "./tabs/AdjustTab";
import BgTab from "./tabs/BgTab";
import CollageTab from "./tabs/CollageTab";
import EffectsTab from "./tabs/EffectsTab";
import FaceEffectsTab from "./tabs/FaceEffectsTab";
import FiltersTab from "./tabs/FiltersTab";
import ReelTab from "./tabs/ReelTab";
import StickerTab from "./tabs/StickerTab";
import TemplatesTab from "./tabs/TemplatesTab";
import TextTab from "./tabs/TextTab";

export default function RightSidebar() {
  const { state, dispatch } = useEditor();
  const [isDownloading, setIsDownloading] = useState(false);

  const FONT_FAMILY_MAP: Record<string, string> = {
    default: "system-ui",
    poppins: "'Poppins', sans-serif",
    pacifico: "'Pacifico', cursive",
    orbitron: "'Orbitron', sans-serif",
    bebas: "'Bebas Neue', sans-serif",
    playfair: "'Playfair Display', serif",
  };

  function handleDownload(format: "png" | "jpeg") {
    if (!state.imageUrl) return;
    setIsDownloading(true);
    const img = new Image();
    img.onload = () => {
      const rad = (state.rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const w = Math.ceil(img.naturalWidth * cos + img.naturalHeight * sin);
      const h = Math.ceil(img.naturalWidth * sin + img.naturalHeight * cos);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      const filterStr = buildFilterString(
        state.adjustments,
        state.activeFilter,
      );
      if (filterStr) ctx.filter = filterStr;

      if (state.bgColor) {
        ctx.fillStyle = state.bgColor;
        ctx.fillRect(0, 0, w, h);
      }

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rad);
      if (state.flipH) ctx.scale(-1, 1);
      if (state.flipV) ctx.scale(1, -1);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      ctx.restore();

      ctx.filter = "none";

      if (state.adjustments.vignette > 0) {
        const vigIntensity = state.adjustments.vignette / 100;
        const gradient = ctx.createRadialGradient(
          w / 2,
          h / 2,
          Math.min(w, h) * 0.3,
          w / 2,
          h / 2,
          Math.max(w, h) * 0.7,
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, `rgba(0,0,0,${vigIntensity * 0.8})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      if (state.adjustments.grain > 0) {
        const grainIntensity = state.adjustments.grain / 100;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * grainIntensity * 80;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);
      }

      const scaleX = w / (img.naturalWidth * cos + img.naturalHeight * sin);
      const scaleY = h / (img.naturalWidth * sin + img.naturalHeight * cos);
      const avgScale = Math.min(scaleX, scaleY);

      for (const layer of state.textLayers) {
        const x = (layer.x / 100) * w;
        const y = (layer.y / 100) * h;
        const fs = layer.fontSize * avgScale;
        ctx.save();
        const fontFamily =
          FONT_FAMILY_MAP[layer.fontFamily ?? "default"] ?? "system-ui";
        ctx.font = `${layer.fontStyle === "bold" ? "bold" : "normal"} ${fs}px ${fontFamily}`;
        ctx.textAlign = (layer.align ?? "center") as CanvasTextAlign;
        ctx.textBaseline = "middle";
        if (layer.fontStyle === "neon") {
          ctx.shadowBlur = 20;
          ctx.shadowColor = layer.color;
          ctx.fillStyle = layer.color;
        } else if (layer.fontStyle === "shadow") {
          ctx.shadowBlur = 8;
          ctx.shadowColor = "rgba(0,0,0,0.8)";
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = layer.color;
        } else if (layer.fontStyle === "stroke") {
          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
          ctx.strokeText(layer.text, x, y);
          ctx.fillStyle = layer.color;
        } else if (layer.fontStyle === "text3d") {
          ctx.fillStyle = "#555";
          ctx.fillText(layer.text, x + 4, y + 4);
          ctx.fillStyle = "#000";
          ctx.fillText(layer.text, x + 2, y + 2);
          ctx.fillStyle = layer.color;
        } else if (layer.fontStyle === "glitch") {
          ctx.fillStyle = "#ff0000";
          ctx.fillText(layer.text, x + 2, y);
          ctx.fillStyle = "#00ffff";
          ctx.fillText(layer.text, x - 2, y);
          ctx.fillStyle = layer.color;
        } else {
          ctx.fillStyle = layer.color;
        }
        ctx.fillText(layer.text, x, y);
        ctx.restore();
      }

      for (const layer of state.stickerLayers) {
        const x = (layer.x / 100) * w;
        const y = (layer.y / 100) * h;
        if (layer.isCustom) {
          const stickerImg = new Image();
          stickerImg.src = layer.content;
          const sz = layer.size * avgScale;
          try {
            ctx.drawImage(stickerImg, x - sz / 2, y - sz / 2, sz, sz);
          } catch (_) {}
        } else {
          const sz = layer.size * avgScale;
          ctx.font = `${sz}px system-ui`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(layer.content, x, y);
        }
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${state.imageName || "photo"}.${format}`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Downloaded as ${format.toUpperCase()}`);
          setIsDownloading(false);
        },
        format === "jpeg" ? "image/jpeg" : "image/png",
        0.95,
      );
    };
    img.onerror = () => setIsDownloading(false);
    img.src = state.imageUrl;
  }

  const activePanel = state.activePanel;
  const isOpen = !!activePanel && activePanel !== "";

  function closePanel() {
    dispatch({ type: "SET_ACTIVE_PANEL", panel: "" });
  }

  function renderPanelContent() {
    switch (activePanel) {
      case "adjust":
        return <AdjustTab />;
      case "filters":
        return <FiltersTab />;
      case "text":
        return <TextTab />;
      case "stickers":
        return <StickerTab />;
      case "face":
        return <FaceEffectsTab />;
      case "effects":
        return <EffectsTab />;
      case "bg":
        return <BgTab />;
      case "templates":
        return <TemplatesTab />;
      case "collage":
        return <CollageTab />;
      case "reel":
        return <ReelTab />;
      default:
        return null;
    }
  }

  const panelLabels: Record<string, string> = {
    adjust: "Adjust",
    filters: "Filters",
    text: "Text",
    stickers: "Stickers",
    face: "Face Effects",
    effects: "Effects",
    bg: "BG Remove",
    templates: "Templates",
    collage: "Collage",
    reel: "Reel Maker",
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close panel"
          data-ocid="sidebar.overlay"
          onClick={closePanel}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 49,
            border: "none",
            cursor: "default",
            width: "100%",
            height: "100%",
            padding: 0,
          }}
        />
      )}

      {/* Slide-up panel */}
      <div
        data-ocid="sidebar.panel"
        style={{
          position: "fixed",
          bottom: isOpen ? 0 : "-100%",
          left: 0,
          width: "100%",
          height: "60%",
          background: "rgba(34, 34, 34, 0.97)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          transition: "bottom 0.3s ease",
          borderRadius: "15px 15px 0 0",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 10,
            paddingBottom: 4,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.2)",
            }}
          />
        </div>

        {/* Panel Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 12px 8px",
            flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            {panelLabels[activePanel ?? ""] ?? "Edit Tools"}
          </span>
          <button
            type="button"
            onClick={closePanel}
            data-ocid="sidebar.close_button"
            aria-label="Close panel"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(255,255,255,0.08)",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: "8px 12px",
            flexShrink: 0,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-1 text-[11px] h-7"
                    onClick={() => dispatch({ type: "RESET" })}
                    data-ocid="actions.reset.button"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Reset all adjustments
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-1 text-[11px] h-7"
                    onClick={() => dispatch({ type: "AUTO_ADJUST" })}
                    data-ocid="actions.auto_adjust.button"
                  >
                    <Sparkles className="w-3 h-3" /> Auto
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Auto-enhance
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-1 text-[11px] h-7"
                    onClick={() => dispatch({ type: "UNDO" })}
                    disabled={state.historyIndex <= 0}
                    data-ocid="actions.undo.button"
                  >
                    <RotateCcw className="w-3 h-3" /> Undo
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Ctrl+Z</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 gap-1 text-[11px] h-7"
                    onClick={() => dispatch({ type: "REDO" })}
                    disabled={state.historyIndex >= state.history.length - 1}
                    data-ocid="actions.redo.button"
                  >
                    <Redo2 className="w-3 h-3" /> Redo
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Ctrl+Y</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Button
              type="button"
              size="sm"
              className="flex-1 gap-1 text-[11px] h-7"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.22 15), oklch(0.55 0.22 15))",
                color: "white",
              }}
              disabled={!state.imageUrl || isDownloading}
              onClick={() => handleDownload("png")}
              data-ocid="actions.download_png.button"
            >
              {isDownloading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              PNG
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 gap-1 text-[11px] h-7"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              disabled={!state.imageUrl || isDownloading}
              onClick={() => handleDownload("jpeg")}
              data-ocid="actions.download_jpg.button"
            >
              <Download className="w-3 h-3" />
              JPG
            </Button>
          </div>
        </div>

        {/* Tab Content - scrollable */}
        <div
          className="edit-tools-panel"
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            padding: "0 0 80px 0",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.15) transparent",
          }}
        >
          {renderPanelContent()}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "6px 12px",
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          &copy; {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            Built with &hearts; caffeine.ai
          </a>
        </div>
      </div>
    </>
  );
}
