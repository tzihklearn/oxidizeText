import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useResizer } from "../composables/useResizer";

describe("useResizer", () => {
  beforeEach(() => {
    // Reset mocks
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Clean up any lingering event listeners
    vi.restoreAllMocks();
  });

  it("returns initial state with default sidebar width of 450", () => {
    const { isDragging, sidebarWidth } = useResizer();
    expect(isDragging.value).toBe(false);
    expect(sidebarWidth.value).toBe(450);
  });

  it("startDrag sets isDragging to true", () => {
    const { isDragging, startDrag } = useResizer();
    const event = new MouseEvent("mousedown", { clientX: 500 });

    startDrag(event);
    expect(isDragging.value).toBe(true);
  });

  it("startDrag registers document event listeners", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const { startDrag } = useResizer();
    const event = new MouseEvent("mousedown", { clientX: 500 });

    startDrag(event);

    expect(addSpy).toHaveBeenCalledWith("mousemove", expect.any(Function), {
      passive: true,
    });
    expect(addSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));
  });

  it("mouseup sets isDragging back to false", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { isDragging, startDrag } = useResizer();

    let mouseUpHandler: (() => void) | null = null;
    vi.spyOn(document, "addEventListener").mockImplementation(
      (event, handler) => {
        if (event === "mouseup") {
          mouseUpHandler = handler as () => void;
        }
      }
    );

    startDrag(new MouseEvent("mousedown", { clientX: 500 }));
    expect(isDragging.value).toBe(true);

    // Simulate mouseup
    mouseUpHandler?.();
    expect(isDragging.value).toBe(false);

    // Should have cleaned up listeners
    expect(removeSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));
  });

  it("mousemove updates sidebarWidth within bounds", () => {
    const { sidebarWidth, startDrag } = useResizer();

    let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
    vi.spyOn(document, "addEventListener").mockImplementation(
      (event, handler) => {
        if (event === "mousemove") {
          mouseMoveHandler = handler as (e: MouseEvent) => void;
        }
      }
    );

    // Start drag at clientX=500 with current width=450
    startDrag(new MouseEvent("mousedown", { clientX: 500 }));

    // Move right by 100 → width should be 550
    mouseMoveHandler?.(new MouseEvent("mousemove", { clientX: 600 }));
    expect(sidebarWidth.value).toBe(550);

    // Move left by 200 from start → width should be 250 (clamped to min)
    mouseMoveHandler?.(new MouseEvent("mousemove", { clientX: 300 }));
    expect(sidebarWidth.value).toBe(250);

    // Move far right → width should be 800 (clamped to max)
    mouseMoveHandler?.(new MouseEvent("mousemove", { clientX: 1500 }));
    expect(sidebarWidth.value).toBe(800);
  });

  it("sidebarWidth stays within min (250) and max (800) bounds", () => {
    const { sidebarWidth, startDrag } = useResizer();

    let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
    vi.spyOn(document, "addEventListener").mockImplementation(
      (event, handler) => {
        if (event === "mousemove") {
          mouseMoveHandler = handler as (e: MouseEvent) => void;
        }
      }
    );

    // Start drag at clientX=450, current width=450
    startDrag(new MouseEvent("mousedown", { clientX: 450 }));

    // Try to go below min
    mouseMoveHandler?.(new MouseEvent("mousemove", { clientX: -1000 }));
    expect(sidebarWidth.value).toBe(250);

    // Try to go above max
    mouseMoveHandler?.(new MouseEvent("mousemove", { clientX: 5000 }));
    expect(sidebarWidth.value).toBe(800);

    // Normal movement
    mouseMoveHandler?.(new MouseEvent("mousemove", { clientX: 500 }));
    expect(sidebarWidth.value).toBe(500);
  });

  it("useResizer does not throw when called multiple times", () => {
    const resizer1 = useResizer();
    const resizer2 = useResizer();

    expect(resizer1.sidebarWidth.value).toBe(450);
    expect(resizer2.sidebarWidth.value).toBe(450);

    // Each instance is independent
    resizer1.sidebarWidth.value = 500;
    expect(resizer1.sidebarWidth.value).toBe(500);
    expect(resizer2.sidebarWidth.value).toBe(450);
  });
});
