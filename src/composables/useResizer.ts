import { ref, onBeforeUnmount } from "vue";

export function useResizer() {
  const isDragging = ref(false);
  const sidebarWidth = ref(450);

  let onMouseMove: ((e: MouseEvent) => void) | null = null;
  let onMouseUp: (() => void) | null = null;

  function startDrag(e: MouseEvent) {
    isDragging.value = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth.value;

    onMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      sidebarWidth.value = Math.min(800, Math.max(250, newWidth));
    };

    onMouseUp = () => {
      isDragging.value = false;
      if (onMouseMove) {
        document.removeEventListener("mousemove", onMouseMove);
      }
      if (onMouseUp) {
        document.removeEventListener("mouseup", onMouseUp);
      }
      onMouseMove = null;
      onMouseUp = null;
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseup", onMouseUp);
  }

  onBeforeUnmount(() => {
    if (onMouseMove) {
      document.removeEventListener("mousemove", onMouseMove);
    }
    if (onMouseUp) {
      document.removeEventListener("mouseup", onMouseUp);
    }
  });

  return {
    isDragging,
    sidebarWidth,
    startDrag,
  };
}
