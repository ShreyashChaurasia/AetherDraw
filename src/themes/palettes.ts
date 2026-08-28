import type { ColorThemeDefinition, ThemeName } from "../types";

export const THEMES: Record<ThemeName, ColorThemeDefinition> = {
  default: {
    name: "Hand-Drawn Classic",
    description: "Classic hand-drawn monochrome sketch with rough edges",
    canvasBackground: "#ffffff",
    nodeStrokes: ["#1e293b", "#334155", "#475569"],
    nodeFills: ["#f8fafc", "#f1f5f9", "#e2e8f0"],
    arrowColor: "#334155",
    textColor: "#0f172a",
    roughness: 1,
    fillStyle: "hachure",
  },
  nord: {
    name: "Nordic Frost",
    description: "Cool arctic palette inspired by the Nord theme",
    canvasBackground: "#2e3440",
    nodeStrokes: ["#88c0d0", "#81a1c1", "#5e81ac", "#b48ead"],
    nodeFills: ["#3b4252", "#434c5e", "#4c566a"],
    arrowColor: "#d8dee9",
    textColor: "#eceff4",
    roughness: 0,
    fillStyle: "solid",
  },
  cyberpunk: {
    name: "Cyberpunk Neon",
    description: "High-contrast neon colors against a dark canvas",
    canvasBackground: "#0a0a0f",
    nodeStrokes: ["#ff007f", "#00f0ff", "#ffe600", "#7928ca"],
    nodeFills: ["#161622", "#1a102f", "#0d2030"],
    arrowColor: "#00f0ff",
    textColor: "#ffffff",
    roughness: 0,
    fillStyle: "solid",
  },
  pastel: {
    name: "Pastel Dream",
    description: "Soft modern pastel tones for friendly, readable diagrams",
    canvasBackground: "#f8fafc",
    nodeStrokes: ["#6366f1", "#ec4899", "#0d9488", "#eab308"],
    nodeFills: ["#e0e7ff", "#fce7f3", "#ccfbf1", "#fef9c3"],
    arrowColor: "#64748b",
    textColor: "#1e293b",
    roughness: 1,
    fillStyle: "solid",
  },
  blueprint: {
    name: "Blueprint",
    description: "Architectural blueprint style with white lines on navy",
    canvasBackground: "#1e3a5f",
    nodeStrokes: ["#ffffff", "#93c5fd", "#60a5fa"],
    nodeFills: ["#172554", "#1e3a5f"],
    arrowColor: "#93c5fd",
    textColor: "#ffffff",
    roughness: 0,
    fillStyle: "hachure",
  },
  minimal_dark: {
    name: "Minimal Dark",
    description: "Sleek and distraction-free dark slate palette",
    canvasBackground: "#0f172a",
    nodeStrokes: ["#94a3b8", "#64748b", "#cbd5e1"],
    nodeFills: ["#1e293b", "#334155"],
    arrowColor: "#94a3b8",
    textColor: "#f8fafc",
    roughness: 0,
    fillStyle: "solid",
  },
  solarized: {
    name: "Solarized",
    description: "Warm, precision color palette designed for low eye strain",
    canvasBackground: "#002b36",
    nodeStrokes: ["#268bd2", "#2aa198", "#859900", "#b58900", "#cb4b16"],
    nodeFills: ["#073642", "#002b36"],
    arrowColor: "#93a1a1",
    textColor: "#fdf6e3",
    roughness: 0,
    fillStyle: "solid",
  },
};

export function getTheme(name?: ThemeName): ColorThemeDefinition {
  if (name && THEMES[name]) {
    return THEMES[name];
  }
  return THEMES.default;
}
