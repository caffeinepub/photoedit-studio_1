import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildFilterString, useEditor } from "@/contexts/EditorContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Download,
  Loader2,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AdjustTab from "./tabs/AdjustTab";
import CollageTab from "./tabs/CollageTab";
import EffectsTab from "./tabs/EffectsTab";
import FiltersTab from "./tabs/FiltersTab";
import ReelTab from "./tabs/ReelTab";
import StickerTab from "./tabs/StickerTab";
import TemplatesTab from "./tabs/TemplatesTab";
import TextTab from "./tabs/TextTab";

const TABS = [
  { id: "adjust", label: "Adjust" },
  { id: "filters", label: "Filters" },
  { id: "text", label: "Text" },
  { id: "stickers", label: "Stickers" },
  { id: "effects", label: "Effects" },
  { id: "templates", label: "Templates" },
  { id: "collage", label: "Collage" },
  { id: "reel", label: "Reel" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface RightSidebarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function RightSidebar({
  sidebarOpen = false,
  setSidebarOpen,
}: RightSidebarProps) {
  const { state, dispatch } = useEditor();
  const [activeTab, setActiveTab] = useState<TabId>("adjust");
  const [isDownloading, setIsDownloading] = useState(false);
  const isMobile = useIsMobile();

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
      ctx.translate(w / 2, h / 2);
      ctx.rotate(rad);
      if (state.flipH) ctx.scale(-1, 1);
      if (state.flipV) ctx.scale(1, -1);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
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

  const mobileStyle: React.CSSProperties = isMobile
    ? {
        position: "absolute",
        top: 0,
        right: 0,
        height: "100%",
        zIndex: 40,
        transform: sidebarOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s ease",
      }
    : {};

  return (
    <aside
      className="flex flex-col border-l border-border flex-shrink-0"
      style={{
        width: 296,
        backgroundColor: "oklch(0.19 0.022 222)",
        ...mobileStyle,
      }}
      data-ocid="sidebar.panel"
    >
      {/* Mobile close button */}
      {isMobile && (
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0"
          style={{ background: "oklch(0.14 0.018 222)" }}
        >
          <span className="text-xs font-semibold text-foreground">
            Edit Tools
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen?.(false)}
            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            data-ocid="sidebar.close_button"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Bar */}
      <div
        className="flex border-b border-border overflow-x-auto scrollbar-none shrink-0"
        style={{ background: "oklch(0.16 0.018 222)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-shrink-0 px-2.5 py-2 text-[11px] font-medium transition-colors whitespace-nowrap border-b-2",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            data-ocid={`sidebar.${tab.id}.tab`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <ScrollArea className="flex-1">
        {activeTab === "adjust" && <AdjustTab />}
        {activeTab === "filters" && <FiltersTab />}
        {activeTab === "text" && <TextTab />}
        {activeTab === "stickers" && <StickerTab />}
        {activeTab === "effects" && <EffectsTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "collage" && <CollageTab />}
        {activeTab === "reel" && <ReelTab />}
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="border-t border-border px-3 py-2.5 space-y-2 shrink-0">
        <div className="flex gap-1.5">
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
              <TooltipContent className="text-xs">Auto-enhance</TooltipContent>
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
                  <Undo2 className="w-3 h-3" /> Undo
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

        <div className="flex gap-1.5">
          <Button
            type="button"
            className="flex-1 gap-1 text-[11px] h-7 bg-primary text-primary-foreground hover:bg-primary/90"
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
            className="flex-1 gap-1 text-[11px] h-7 bg-primary/80 text-primary-foreground hover:bg-primary/70"
            disabled={!state.imageUrl || isDownloading}
            onClick={() => handleDownload("jpeg")}
            data-ocid="actions.download_jpeg.button"
          >
            <Download className="w-3 h-3" />
            JPEG
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div
        className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground text-center shrink-0"
        style={{ background: "oklch(0.16 0.018 222)" }}
      >
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Built with ♥ caffeine.ai
        </a>
      </div>
    </aside>
  );
}
