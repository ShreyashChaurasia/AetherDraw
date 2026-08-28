import { exportToSvg, exportToBlob } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ModelContextTool } from "../types";

export function createExportCanvasTool(getAPI: () => ExcalidrawImperativeAPI | null): ModelContextTool {
  return {
    name: "export_canvas",
    description:
      "Exports the current canvas content as a high-resolution SVG or PNG image data URL.",
    inputSchema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["svg", "png"],
          default: "png",
          description: "Export file format",
        },
        padding: {
          type: "number",
          default: 20,
          description: "Padding in pixels around diagram content",
        },
        darkMode: {
          type: "boolean",
          default: false,
          description: "Whether to export in dark mode",
        },
      },
    },
    annotations: {
      readOnlyHint: true,
      category: "export",
    },
    async execute(input: { format?: "svg" | "png"; padding?: number; darkMode?: boolean } = {}) {
      const api = getAPI();
      if (!api) throw new Error("AetherDraw canvas is not yet initialized");

      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();

      const format = input.format || "png";
      const padding = input.padding ?? 20;
      const darkMode = input.darkMode ?? false;

      if (format === "svg") {
        const svgElement = await exportToSvg({
          elements,
          appState: {
            ...appState,
            exportWithDarkMode: darkMode,
            exportBackground: true,
          },
          files,
          exportPadding: padding,
        });

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

        return {
          format: "svg",
          dataUrl,
          svgContent: svgString,
        };
      } else {
        const blob = await exportToBlob({
          elements,
          appState: {
            ...appState,
            exportWithDarkMode: darkMode,
            exportBackground: true,
          },
          files,
          mimeType: "image/png",
          exportPadding: padding,
        });

        // Convert blob to base64 data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        return {
          format: "png",
          dataUrl,
          sizeBytes: blob.size,
        };
      }
    },
  };
}
