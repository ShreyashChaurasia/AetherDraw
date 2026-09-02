import React, { useCallback, useEffect } from "react";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import { webMCPRegistry } from "../../webmcp/registry";
import {
  ExternalLink,
  BookOpen,
  Bug,
  Info,
  Terminal,
  Video,
  Grid,
} from "lucide-react";

const GithubIcon: React.FC = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

interface ExcalidrawCanvasProps {
  onApiReady?: (api: ExcalidrawImperativeAPI) => void;
  theme?: "light" | "dark";
  onOpenAbout?: () => void;
}

export const ExcalidrawCanvas: React.FC<ExcalidrawCanvasProps> = ({
  onApiReady,
  theme = "dark",
  onOpenAbout,
}) => {
  const apiRef = React.useRef<ExcalidrawImperativeAPI | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).EXCALIDRAW_ASSET_PATH = "/excalidraw-assets/";
      if (!localStorage.getItem("excalidraw-theme")) {
        localStorage.setItem("excalidraw-theme", "dark");
      }
    }
  }, []);

  const handleExcalidrawAPI = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      apiRef.current = api;
      webMCPRegistry.setCanvasAPI(api);
      if (typeof window !== "undefined") {
        (window as any)._aetherdrawAPI = api;
      }
      if (onApiReady) {
        onApiReady(api);
      }
    },
    [onApiReady]
  );

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Excalidraw
        excalidrawAPI={handleExcalidrawAPI}
        theme={theme}
        initialData={{
          appState: {
            theme: "dark",
            viewBackgroundColor: "#ffffff",
          },
        }}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: true,
            export: { saveFileToDisk: true },
          },
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.Item
            icon={<Grid className="w-4 h-4 text-indigo-400" />}
            onClick={() => {
              if (apiRef.current) {
                const currentGrid = apiRef.current.getAppState().gridModeEnabled;
                apiRef.current.updateScene({
                  appState: { gridModeEnabled: !currentGrid },
                });
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("aetherdraw:gridchange", {
                      detail: { enabled: !currentGrid },
                    })
                  );
                }
              }
            }}
          >
            Toggle Grid (Ctrl + ')
          </MainMenu.Item>
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.Separator />

          {/* Custom About Modal Trigger */}
          {onOpenAbout && (
            <MainMenu.Item
              icon={<Info className="w-4 h-4 text-indigo-400" />}
              onClick={onOpenAbout}
            >
              About AetherDraw
            </MainMenu.Item>
          )}

          {/* Documentation Link */}
          <MainMenu.ItemLink
            href="https://github.com/ShreyashChaurasia/AetherDraw#readme"
            target="_blank"
            rel="noopener noreferrer"
            icon={<BookOpen className="w-4 h-4 text-indigo-400" />}
          >
            Documentation (README)
          </MainMenu.ItemLink>

          {/* GitHub Issues Link */}
          <MainMenu.ItemLink
            href="https://github.com/ShreyashChaurasia/AetherDraw/issues"
            target="_blank"
            rel="noopener noreferrer"
            icon={<Bug className="w-4 h-4 text-rose-400" />}
          >
            Report an Issue
          </MainMenu.ItemLink>

          {/* AetherDraw GitHub Repository Link */}
          <MainMenu.ItemLink
            href="https://github.com/ShreyashChaurasia/AetherDraw"
            target="_blank"
            rel="noopener noreferrer"
            icon={<GithubIcon />}
          >
            AetherDraw Repository
          </MainMenu.ItemLink>

          {/* DevPost WebMCP Challenge Link */}
          <MainMenu.ItemLink
            href="https://webmcp.devpost.com/"
            target="_blank"
            rel="noopener noreferrer"
            icon={<ExternalLink className="w-4 h-4 text-emerald-400" />}
          >
            DevPost WebMCP Challenge
          </MainMenu.ItemLink>

          {/* Excalidraw Core Attribution Link */}
          <MainMenu.ItemLink
            href="https://github.com/excalidraw/excalidraw"
            target="_blank"
            rel="noopener noreferrer"
            icon={<Terminal className="w-4 h-4 text-amber-400" />}
          >
            Built with Excalidraw Core
          </MainMenu.ItemLink>

          {/* Video Demo Link (Placeholder preserved as requested) */}
          <MainMenu.ItemLink
            href="https://www.youtube.com/"
            target="_blank"
            rel="noopener noreferrer"
            icon={<Video className="w-4 h-4 text-red-400" />}
          >
            Video Demo (YouTube)
          </MainMenu.ItemLink>
        </MainMenu>
      </Excalidraw>
    </div>
  );
};
