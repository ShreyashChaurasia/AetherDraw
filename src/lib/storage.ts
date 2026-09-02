import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement, Theme } from "@excalidraw/excalidraw/element/types";

export const STORAGE_KEY_ELEMENTS = "aetherdraw_elements";
export const STORAGE_KEY_APP_STATE = "aetherdraw_app_state";
export const STORAGE_KEY_FILES = "aetherdraw_files";

export interface StoredScene {
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
  files?: BinaryFiles;
}

export function getDurableAppState(appState: AppState): Partial<AppState> {
  return {
    viewBackgroundColor: appState.viewBackgroundColor || "#ffffff",
    gridModeEnabled: !!appState.gridModeEnabled,
    zoom: appState.zoom,
    scrollX: appState.scrollX,
    scrollY: appState.scrollY,
    theme: (appState.theme === "light" ? "light" : "dark") as Theme,
  };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveSceneToStorage(
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  files?: BinaryFiles
): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    try {
      if (typeof window === "undefined") return;

      const nonDeleted = elements.filter((el) => !el.isDeleted);
      localStorage.setItem(STORAGE_KEY_ELEMENTS, JSON.stringify(nonDeleted));

      const durableState = getDurableAppState(appState);
      localStorage.setItem(STORAGE_KEY_APP_STATE, JSON.stringify(durableState));

      if (files && Object.keys(files).length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
        } catch (fileErr) {
          console.warn("Storage quota exceeded for binary files:", fileErr);
        }
      }
    } catch (err) {
      console.warn("Failed to autosave canvas to localStorage:", err);
    }
  }, 400);
}

export function loadSceneFromStorage(): StoredScene | null {
  try {
    if (typeof window === "undefined") return null;

    const rawElements = localStorage.getItem(STORAGE_KEY_ELEMENTS);
    const rawState = localStorage.getItem(STORAGE_KEY_APP_STATE);
    const rawFiles = localStorage.getItem(STORAGE_KEY_FILES);

    if (!rawElements && !rawState) {
      return null;
    }

    const elements: ExcalidrawElement[] = rawElements ? JSON.parse(rawElements) : [];
    const partialState: Partial<AppState> = rawState ? JSON.parse(rawState) : {};
    const files: BinaryFiles | undefined = rawFiles ? JSON.parse(rawFiles) : undefined;

    return {
      elements,
      appState: {
        theme: (partialState.theme === "light" ? "light" : "dark") as Theme,
        viewBackgroundColor: partialState.viewBackgroundColor || "#ffffff",
        ...partialState,
      },
      files,
    };
  } catch (err) {
    console.warn("Failed to load saved scene from localStorage:", err);
    return null;
  }
}

export function clearSceneStorage(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY_ELEMENTS);
    localStorage.removeItem(STORAGE_KEY_APP_STATE);
    localStorage.removeItem(STORAGE_KEY_FILES);
  } catch (err) {
    console.warn("Failed to clear scene from localStorage:", err);
  }
}
