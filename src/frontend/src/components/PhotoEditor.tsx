import { EditorProvider, useEditor } from "@/contexts/EditorContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { PanelRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import CanvasStage from "./editor/CanvasStage";
import EditorHeader from "./editor/EditorHeader";
import LeftToolbar from "./editor/LeftToolbar";
import ProjectsStrip from "./editor/ProjectsStrip";
import RightSidebar from "./editor/RightSidebar";

function EditorInner() {
  const { state, dispatch } = useEditor();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }
    },
    [dispatch],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close sidebar when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <LeftToolbar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <CanvasStage />
          {!state.imageUrl && <ProjectsStrip />}
        </div>
        <RightSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Mobile overlay behind sidebar */}
        {isMobile && sidebarOpen && (
          <button
            type="button"
            className="absolute inset-0 bg-black/50 z-30 w-full cursor-default"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
            data-ocid="sidebar.overlay"
            aria-label="Close panel"
          />
        )}

        {/* Mobile toggle button */}
        {isMobile && !sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="absolute bottom-16 right-4 z-40 flex items-center justify-center w-11 h-11 rounded-full shadow-lg"
            style={{ background: "oklch(0.55 0.22 240)" }}
            data-ocid="sidebar.open_modal_button"
            aria-label="Open tools panel"
          >
            <PanelRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function PhotoEditor() {
  return (
    <EditorProvider>
      <EditorInner />
    </EditorProvider>
  );
}
