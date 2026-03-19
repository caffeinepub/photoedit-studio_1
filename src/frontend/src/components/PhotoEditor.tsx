import { EditorProvider, useEditor } from "@/contexts/EditorContext";
import { useCallback, useEffect } from "react";
import BottomTabBar from "./editor/BottomTabBar";
import CanvasStage from "./editor/CanvasStage";
import EditorHeader from "./editor/EditorHeader";
import ProjectsStrip from "./editor/ProjectsStrip";
import RightSidebar from "./editor/RightSidebar";

function EditorInner() {
  const { state, dispatch } = useEditor();

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

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden relative">
            <CanvasStage />
            {!state.imageUrl && <ProjectsStrip />}
          </div>
          <BottomTabBar />
        </div>
      </div>
      {/* Fixed bottom slide-up panel (overlays canvas) */}
      <RightSidebar />
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
