import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type Tool, useEditor } from "@/contexts/EditorContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Crop,
  FlipHorizontal2,
  FlipVertical2,
  Maximize2,
  MousePointer2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface ToolItem {
  id: Tool | "zoom-in" | "zoom-out" | "fit";
  icon: React.ReactNode;
  label: string;
  action?: () => void;
}

export default function LeftToolbar() {
  const { state, dispatch } = useEditor();
  const isMobile = useIsMobile();

  const tools: ToolItem[] = [
    {
      id: "select",
      icon: <MousePointer2 className="w-4 h-4" />,
      label: "Select / Move",
    },
    { id: "crop", icon: <Crop className="w-4 h-4" />, label: "Crop" },
  ];

  const transforms: ToolItem[] = [
    {
      id: "rotate",
      icon: <RotateCcw className="w-4 h-4" />,
      label: "Rotate Left 90°",
      action: () => dispatch({ type: "ROTATE_90", dir: "left" }),
    },
    {
      id: "rotate",
      icon: <RotateCw className="w-4 h-4" />,
      label: "Rotate Right 90°",
      action: () => dispatch({ type: "ROTATE_90", dir: "right" }),
    },
    {
      id: "fliph",
      icon: <FlipHorizontal2 className="w-4 h-4" />,
      label: "Flip Horizontal",
      action: () => dispatch({ type: "FLIP_H" }),
    },
    {
      id: "flipv",
      icon: <FlipVertical2 className="w-4 h-4" />,
      label: "Flip Vertical",
      action: () => dispatch({ type: "FLIP_V" }),
    },
  ];

  const zoomItems: ToolItem[] = [
    {
      id: "zoom-in",
      icon: <ZoomIn className="w-4 h-4" />,
      label: "Zoom In",
      action: () => dispatch({ type: "SET_ZOOM", zoom: state.zoom * 1.25 }),
    },
    {
      id: "zoom-out",
      icon: <ZoomOut className="w-4 h-4" />,
      label: "Zoom Out",
      action: () => dispatch({ type: "SET_ZOOM", zoom: state.zoom * 0.8 }),
    },
    {
      id: "fit",
      icon: <Maximize2 className="w-4 h-4" />,
      label: "Fit to Screen",
      action: () => dispatch({ type: "SET_ZOOM", zoom: 1 }),
    },
  ];

  function renderBtn(item: ToolItem, idx: number) {
    const isActive =
      tools.some((t) => t.id === item.id) && state.activeTool === item.id;
    return (
      <Tooltip key={idx}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-md transition-colors",
              isMobile ? "w-8 h-8" : "w-9 h-9",
              isActive
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            onClick={
              item.action
                ? item.action
                : () => dispatch({ type: "SET_TOOL", tool: item.id as Tool })
            }
            data-ocid={`toolbar.${item.id}.button`}
          >
            {item.icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={isMobile ? "top" : "right"} className="text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Mobile: compact horizontal strip at the bottom
  if (isMobile) {
    const allItems = [...tools, ...transforms, ...zoomItems];
    return (
      <TooltipProvider delayDuration={300}>
        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-1 px-2 py-1.5 border-t border-border overflow-x-auto scrollbar-none"
          style={{ backgroundColor: "oklch(0.19 0.022 222)" }}
          data-ocid="toolbar.panel"
        >
          {allItems.map(renderBtn)}
          <div className="ml-2 text-[10px] text-muted-foreground font-mono shrink-0">
            {Math.round(state.zoom * 100)}%
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Desktop: vertical sidebar
  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className="flex flex-col items-center py-3 gap-1 border-r border-border flex-shrink-0"
        style={{ width: 56, backgroundColor: "oklch(0.19 0.022 222)" }}
        data-ocid="toolbar.panel"
      >
        {tools.map(renderBtn)}
        <Separator className="my-2 w-8 bg-border" />
        {transforms.map(renderBtn)}
        <div className="flex-1" />
        <Separator className="my-2 w-8 bg-border" />
        {zoomItems.map(renderBtn)}
        <div className="mt-1 text-[10px] text-muted-foreground font-mono px-1 text-center leading-tight">
          {Math.round(state.zoom * 100)}%
        </div>
      </aside>
    </TooltipProvider>
  );
}
