import { useEditor } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

export default function BeforeAfterSlider() {
  const { state, buildFilterString } = useEditor();
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const filterStr = buildFilterString(state.adjustments, state.activeFilter);
  const imgTransform = [
    `rotate(${state.rotation}deg)`,
    state.flipH ? "scaleX(-1)" : "",
    state.flipV ? "scaleY(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
    setPosition(pct);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      const onMove = (ev: MouseEvent) => updatePosition(ev.clientX);
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [updatePosition],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      updatePosition(e.touches[0].clientX);
    },
    [updatePosition],
  );

  if (!state.beforeImageUrl || !state.imageUrl) return null;

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-lg shadow-2xl"
      style={{
        maxWidth: "calc(100vw - 400px)",
        maxHeight: "calc(100vh - 140px)",
      }}
      data-ocid="before_after.canvas_target"
    >
      {/* After (edited) - full width */}
      <img
        src={state.imageUrl}
        alt="After — edited version"
        className="block w-full h-auto"
        style={{
          filter: filterStr || "none",
          transform: imgTransform || "none",
          maxHeight: "calc(100vh - 140px)",
          objectFit: "contain",
          userSelect: "none",
          pointerEvents: "none",
        }}
        draggable={false}
      />

      {/* Before - clipped left portion */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={state.beforeImageUrl}
          alt="Before — original version"
          className="block w-full h-auto"
          style={{
            maxHeight: "calc(100vh - 140px)",
            objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
          }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <div
        className="absolute top-3 left-3 text-xs font-bold px-2 py-0.5 rounded"
        style={{
          background: "oklch(0.15 0.02 222 / 0.85)",
          color: "oklch(0.75 0.02 222)",
        }}
      >
        BEFORE
      </div>
      <div
        className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded"
        style={{ background: "oklch(0.40 0.18 280 / 0.85)", color: "white" }}
      >
        AFTER
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 z-10"
        style={{ left: `${position}%`, background: "oklch(0.85 0.01 222)" }}
      />

      {/* Handle */}
      <div
        className={cn(
          "absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 flex items-center justify-center cursor-ew-resize",
          "bg-card border-border shadow-lg",
        )}
        style={{ left: `${position}%` }}
        onMouseDown={handleMouseDown}
        onTouchMove={handleTouchMove}
        data-ocid="before_after.drag_handle"
        aria-label="Drag to compare before and after"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 8L2 5m0 0l3-3M2 5h5M11 8l3-3m0 0l-3-3m3 3h-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          />
        </svg>
      </div>
    </div>
  );
}
