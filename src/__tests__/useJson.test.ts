import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useJson } from "../composables/useJson";
import { useAppStore } from "../stores/appStore";

// Mock the Tauri invoke function
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const mockedInvoke = vi.mocked(invoke);

describe("useJson", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedInvoke.mockReset();
  });

  describe("format", () => {
    it("calls format_json and returns the result", async () => {
      mockedInvoke.mockResolvedValueOnce('{\n  "a": 1\n}');
      const { format } = useJson();
      const store = useAppStore();

      const result = await format('{"a":1}');

      expect(mockedInvoke).toHaveBeenCalledWith("format_json", {
        input: '{"a":1}',
      });
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it("sets isLoading while formatting", async () => {
      mockedInvoke.mockResolvedValueOnce('{\n  "a": 1\n}');
      const { format } = useJson();
      const store = useAppStore();

      const promise = format('{"a":1}');
      expect(store.isLoading).toBe(true);

      await promise;
      expect(store.isLoading).toBe(false);
    });

    it("sets isLoading to false even on error", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("Parse error"));
      const { format } = useJson();
      const store = useAppStore();

      await expect(format("invalid")).rejects.toThrow();
      expect(store.isLoading).toBe(false);
    });
  });

  describe("minify", () => {
    it("calls minify_json and returns compact JSON", async () => {
      mockedInvoke.mockResolvedValueOnce('{"a":1,"b":2}');
      const { minify } = useJson();

      const result = await minify('{\n  "a": 1,\n  "b": 2\n}');

      expect(mockedInvoke).toHaveBeenCalledWith("minify_json", {
        input: '{\n  "a": 1,\n  "b": 2\n}',
      });
      expect(result).toBe('{"a":1,"b":2}');
    });

    it("sets isLoading while minifying", async () => {
      mockedInvoke.mockResolvedValueOnce('{"a":1}');
      const { minify } = useJson();
      const store = useAppStore();

      const promise = minify('{"a":1}');
      expect(store.isLoading).toBe(true);

      await promise;
      expect(store.isLoading).toBe(false);
    });
  });

  describe("validate", () => {
    it("returns true for valid JSON", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);
      const { validate } = useJson();

      const result = await validate('{"valid": true}');

      expect(mockedInvoke).toHaveBeenCalledWith("validate_json", {
        input: '{"valid": true}',
      });
      expect(result).toBe(true);
    });

    it("returns false for invalid JSON", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("Invalid JSON"));
      const { validate } = useJson();

      const result = await validate("not json");

      expect(result).toBe(false);
    });

    it("sets isLoading correctly during validation", async () => {
      mockedInvoke.mockResolvedValueOnce(undefined);
      const { validate } = useJson();
      const store = useAppStore();

      const promise = validate('{"a":1}');
      expect(store.isLoading).toBe(true);

      await promise;
      expect(store.isLoading).toBe(false);
    });
  });

  describe("loadTree", () => {
    const mockTreeData = [
      {
        id: "uuid-1",
        key: "root",
        path: "$",
        type_label: "object (2)",
        preview: "",
        children: [
          {
            id: "uuid-2",
            key: "name",
            path: "$.name",
            type_label: "string",
            preview: "test",
          },
        ],
      },
    ];

    it("calls json_to_tree and updates store treeData", async () => {
      mockedInvoke.mockResolvedValueOnce(mockTreeData);
      const { loadTree } = useJson();
      const store = useAppStore();

      await loadTree('{"name": "test"}');

      expect(mockedInvoke).toHaveBeenCalledWith("json_to_tree", {
        input: '{"name": "test"}',
      });
      expect(store.treeData).toEqual(mockTreeData);
    });

    it("clears treeData on error", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("Parse error"));
      const { loadTree } = useJson();
      const store = useAppStore();

      // Set some initial data first
      store.setTreeData(mockTreeData);
      expect(store.treeData).toHaveLength(1);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await loadTree("invalid json");

      expect(store.treeData).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("sets isLoading correctly during tree loading", async () => {
      mockedInvoke.mockResolvedValueOnce(mockTreeData);
      const { loadTree } = useJson();
      const store = useAppStore();

      const promise = loadTree('{"a":1}');
      expect(store.isLoading).toBe(true);

      await promise;
      expect(store.isLoading).toBe(false);
    });

    it("sets isLoading to false on error", async () => {
      mockedInvoke.mockRejectedValueOnce(new Error("Error"));
      const { loadTree } = useJson();
      const store = useAppStore();

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await loadTree("bad");
      expect(store.isLoading).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe("isLoading reference", () => {
    it("exposes isLoading as a snapshot of store state", () => {
      const { isLoading } = useJson();
      // isLoading is destructured at creation time — a snapshot, not a reactive binding
      expect(isLoading).toBe(false);
    });

    it("store.isLoading reflects actual loading state", () => {
      const store = useAppStore();
      store.setLoading(true);
      expect(store.isLoading).toBe(true);
      store.setLoading(false);
      expect(store.isLoading).toBe(false);
    });
  });
});
