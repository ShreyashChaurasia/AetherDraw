import { exportToSvg, exportToCanvas } from "@excalidraw/excalidraw";
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

      // Generate SVG first
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
      const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

      if (format === "svg") {
        return {
          format: "svg",
          dataUrl: svgDataUrl,
          svgContent: svgString,
        };
      }

      // Convert SVG to PNG data URL via Canvas
      try {
        const canvas = await exportToCanvas({
          elements,
          appState: {
            ...appState,
            exportWithDarkMode: darkMode,
            exportBackground: true,
          },
          files,
          exportPadding: padding,
        });

        const pngDataUrl = canvas.toDataURL("image/png");
        return {
          format: "png",
          dataUrl: pngDataUrl,
          width: canvas.width,
          height: canvas.height,
        };
      } catch (canvasErr) {
        // Fallback: render SVG to canvas image
        const pngDataUrl = await new Promise<string>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = img.width || 800;
            tempCanvas.height = img.height || 600;
            const ctx = tempCanvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(tempCanvas.toDataURL("image/png"));
            } else {
              resolve(svgDataUrl);
            }
          };
          img.onerror = () => resolve(svgDataUrl);
          img.src = svgDataUrl;
        });

        return {
          format: "png",
          dataUrl: pngDataUrl,
        };
      }
    },
  };
}
