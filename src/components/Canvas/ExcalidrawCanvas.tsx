import React, { useCallback, useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { webMCPRegistry } from "../../webmcp/registry";

interface ExcalidrawCanvasProps {
  theme?: "light" | "dark";
  onApiReady?: (api: ExcalidrawImperativeAPI) => void;
}

export const ExcalidrawCanvas: React.FC<ExcalidrawCanvasProps> = ({ theme = "dark", onApiReady }) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).EXCALIDRAW_ASSET_PATH = "/excalidraw-assets/";
    }
  }, []);

  const handleExcalidrawAPI = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      webMCPRegistry.setCanvasAPI(api);
      if (onApiReady) {
        onApiReady(api);
      }
    },
    [onApiReady]
  );

  return (
    <div className="w-full h-full relative overflow-hidden bg-neutral-950">
      <Excalidraw
        excalidrawAPI={handleExcalidrawAPI}
        theme={theme}
        gridModeEnabled={true}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: true,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
};
