import { SITE_CONFIG } from "../config";

export interface ThemeConfig {
  id: string;
  name: string;
  gradient: string[];
  dye: {
    low: [number, number, number];
    mid: [number, number, number];
    high: [number, number, number];
    peak: [number, number, number];
  };
}

export const THEMES: Record<string, ThemeConfig> = {
  "everforest-dark": {
    id: "everforest-dark",
    name: "Everforest Dark",
    gradient: ["#1e2326", "#272e33", "#3b4252", "#7fbbb3", "#a7c080", "#d3c6aa"],
    dye: {
      low: [0.52, 0.57, 0.54],
      mid: [0.5, 0.73, 0.7],
      high: [0.9, 0.6, 0.43],
      peak: [0.86, 0.49, 0.5], // Red accent
    },
  },
  "everforest-light": {
    id: "everforest-light",
    name: "Everforest Light",
    gradient: ["#f3ead3", "#e5dcc5", "#d4c5a1", "#859289", "#56635a", "#2f3831"],
    dye: {
      low: [0.85, 0.82, 0.71],
      mid: [0.52, 0.57, 0.54],
      high: [0.35, 0.4, 0.38],
      peak: [0.9, 0.6, 0.43], // Orange accent
    },
  },
  "everforest-vivid": {
    id: "everforest-vivid",
    name: "Everforest Vivid",
    gradient: ["#1e2326", "#e67e80", "#dbbc7f", "#a7c080", "#83c092", "#7fbbb3"],
    dye: {
      low: [0.9, 0.49, 0.5], // Red
      mid: [0.86, 0.74, 0.5], // Yellow
      high: [0.65, 0.75, 0.5], // Green
      peak: [0.5, 0.73, 0.7], // Aqua
    },
  },
  "gruvbox-dark": {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    gradient: ["#282828", "#3c3836", "#504945", "#b8bb26", "#fabd2f", "#ebdbb2"],
    dye: {
      low: [0.72, 0.73, 0.05],
      mid: [0.98, 0.74, 0.18],
      high: [0.84, 0.24, 0.13],
      peak: [0.83, 0.53, 0.61], // Purple
    },
  },
  "gruvbox-vivid": {
    id: "gruvbox-vivid",
    name: "Gruvbox Vivid",
    gradient: ["#282828", "#fb4934", "#fabd2f", "#b8bb26", "#83a598", "#d3869b"],
    dye: {
      low: [0.98, 0.29, 0.2], // Red
      mid: [0.98, 0.74, 0.18], // Yellow
      high: [0.72, 0.73, 0.05], // Green
      peak: [0.51, 0.65, 0.6], // Blue
    },
  },
  "nord": {
    id: "nord",
    name: "Nord",
    gradient: ["#2e3440", "#3b4252", "#434c5e", "#88c0d0", "#8fbcbb", "#eceff4"],
    dye: {
      low: [0.53, 0.75, 0.82],
      mid: [0.56, 0.74, 0.73],
      high: [0.71, 0.56, 0.68],
      peak: [0.93, 0.94, 0.96], // Snow Storm
    },
  },
  "nord-vivid": {
    id: "nord-vivid",
    name: "Nord Vivid",
    gradient: ["#2e3440", "#bf616a", "#ebcb8b", "#a3be8c", "#88c0d0", "#b48ead"],
    dye: {
      low: [0.75, 0.38, 0.42], // Red
      mid: [0.92, 0.8, 0.55], // Yellow
      high: [0.64, 0.75, 0.55], // Green
      peak: [0.53, 0.75, 0.82], // Frost
    },
  },
};

export function getTheme(id: string): ThemeConfig {
  return THEMES[id] || THEMES[SITE_CONFIG.defaultTheme];
}
