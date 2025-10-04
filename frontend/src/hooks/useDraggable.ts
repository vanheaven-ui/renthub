import { useState, useRef, useCallback, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface DraggableHandlers {
  targetRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent) => void;
  style: React.CSSProperties;
}

interface DraggableOptions {
  initialPosition?: Position;
  bounds?: Bounds;
}

export const useDraggable = (
  options: DraggableOptions = {}
): DraggableHandlers => {
  const { initialPosition = { x: 0, y: 0 }, bounds } = options;
  const targetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only allow left click
    if (e.button !== 0) return;
    const target = targetRef.current;
    if (!target) return;

    // Prevent text selection
    e.preventDefault();
    target.setPointerCapture(e.pointerId);

    const rect = target.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;

      let newX = e.clientX - offset.x;
      let newY = e.clientY - offset.y;

      // Apply bounds if provided
      if (bounds) {
        newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
        newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
      }

      setPosition({ x: newX, y: newY });
    },
    [isDragging, offset, bounds]
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    } else {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    }

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDragging, onPointerMove, onPointerUp]);

  const style: React.CSSProperties = {
    position: "fixed",
    left: position.x,
    top: position.y,
    cursor: isDragging ? "grabbing" : "grab",
    willChange: "left, top",
    zIndex: 9999,
  };

  return { targetRef, onPointerDown, style };
};
