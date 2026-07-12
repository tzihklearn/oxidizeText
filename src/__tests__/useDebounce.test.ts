import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounce } from "../composables/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("delays function execution by the specified delay", () => {
    const fn = vi.fn();
    const debounced = useDebounce(fn, 300);

    debounced("arg1", "arg2");
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("uses default delay of 500ms when not specified", () => {
    const fn = vi.fn();
    const debounced = useDebounce(fn);

    debounced();
    vi.advanceTimersByTime(499);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancels pending calls when invoked again within the delay window", () => {
    const fn = vi.fn();
    const debounced = useDebounce(fn, 200);

    debounced("first");
    vi.advanceTimersByTime(100);
    debounced("second");
    vi.advanceTimersByTime(100);
    // First call should NOT fire (only 100ms passed, then reset)

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    // Second call fires after 200ms from its invocation
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("second");
  });

  it("passes all arguments through to the original function", () => {
    const fn = vi.fn();
    const debounced = useDebounce(fn, 100);

    debounced(1, "hello", { key: "value" });
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith(1, "hello", { key: "value" });
  });

  it("works with zero delay", () => {
    const fn = vi.fn();
    const debounced = useDebounce(fn, 0);

    debounced();
    vi.advanceTimersByTime(0);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles multiple rapid calls, only executing the last one", () => {
    const fn = vi.fn();
    const debounced = useDebounce(fn, 100);

    for (let i = 0; i < 10; i++) {
      debounced(i);
    }

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(9);
  });
});
