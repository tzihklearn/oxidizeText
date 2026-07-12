import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useAppStore } from "../stores/appStore";

describe("appStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("initial state", () => {
    it("has empty initial values", () => {
      const store = useAppStore();
      expect(store.inputText).toBe("");
      expect(store.outputText).toBe("");
      expect(store.treeData).toEqual([]);
      expect(store.isLoading).toBe(false);
      expect(store.isValidJson).toBe(true);
      expect(store.viewMode).toBe("tree");
      expect(store.filePath).toBe("");
      expect(store.isDirty).toBe(false);
    });
  });

  describe("actions", () => {
    it("setInput updates inputText and marks dirty", () => {
      const store = useAppStore();
      store.setInput('{"hello": "world"}');
      expect(store.inputText).toBe('{"hello": "world"}');
      expect(store.isDirty).toBe(true);
    });

    it("setOutput updates outputText", () => {
      const store = useAppStore();
      store.setOutput("formatted output");
      expect(store.outputText).toBe("formatted output");
    });

    it("setTreeData updates treeData", () => {
      const store = useAppStore();
      const treeData = [
        {
          id: "1",
          key: "root",
          path: "$",
          type_label: "object (1)",
          preview: "",
          children: [],
        },
      ];
      store.setTreeData(treeData);
      expect(store.treeData).toEqual(treeData);
    });

    it("setLoading toggles isLoading", () => {
      const store = useAppStore();
      expect(store.isLoading).toBe(false);
      store.setLoading(true);
      expect(store.isLoading).toBe(true);
      store.setLoading(false);
      expect(store.isLoading).toBe(false);
    });

    it("setIsValidJson updates isValidJson", () => {
      const store = useAppStore();
      store.setIsValidJson(false);
      expect(store.isValidJson).toBe(false);
      store.setIsValidJson(true);
      expect(store.isValidJson).toBe(true);
    });

    it("setViewMode updates viewMode", () => {
      const store = useAppStore();
      store.setViewMode("text");
      expect(store.viewMode).toBe("text");
      store.setViewMode("tree");
      expect(store.viewMode).toBe("tree");
    });

    it("toggleViewMode switches between tree and text", () => {
      const store = useAppStore();
      expect(store.viewMode).toBe("tree");
      store.toggleViewMode();
      expect(store.viewMode).toBe("text");
      store.toggleViewMode();
      expect(store.viewMode).toBe("tree");
    });

    it("setFilePath updates filePath and resets isDirty", () => {
      const store = useAppStore();
      store.setInput("content");
      expect(store.isDirty).toBe(true);

      store.setFilePath("/path/to/file.json");
      expect(store.filePath).toBe("/path/to/file.json");
      expect(store.isDirty).toBe(false);
    });

    it("markDirty sets isDirty to true", () => {
      const store = useAppStore();
      expect(store.isDirty).toBe(false);
      store.markDirty();
      expect(store.isDirty).toBe(true);
    });

    it("setInput followed by setFilePath marks clean", () => {
      const store = useAppStore();
      store.setInput("content"); // marks dirty
      store.setFilePath("/file.json"); // marks clean
      expect(store.isDirty).toBe(false);
      expect(store.inputText).toBe("content");
      expect(store.filePath).toBe("/file.json");
    });
  });

  describe("getters", () => {
    it("fileName returns 'untitled' when no file path", () => {
      const store = useAppStore();
      expect(store.fileName).toBe("untitled");
    });

    it("fileName extracts basename from path", () => {
      const store = useAppStore();
      store.setFilePath("/home/user/data.json");
      expect(store.fileName).toBe("data.json");
    });

    it("fileName handles paths without directory", () => {
      const store = useAppStore();
      store.setFilePath("data.json");
      expect(store.fileName).toBe("data.json");
    });
  });
});
