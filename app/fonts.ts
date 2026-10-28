import localFont from "next/font/local";
export const newsreader = localFont({
  src: [
    {
      path: "../public/fonts/newsreader-normal-200-800.woff2",
      style: "normal",
      weight: "200 800",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
export const sourceSerif = localFont({
  src: [
    {
      path: "../public/fonts/source-serif-4-latin.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "../public/fonts/source-serif-4-latin-italic.woff2",
      weight: "400 700",
      style: "italic",
    },
  ],
  variable: "--font-source-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});
export const sourceSans = localFont({
  src: [
    {
      path: "../public/fonts/source-sans-3-latin.woff2",
      weight: "400 700",
      style: "normal",
    },
  ],
  variable: "--font-source-sans",
  display: "swap",
});
export const plexMono = localFont({
  src: [
    { path: "../public/fonts/ibm-plex-mono-normal-400.woff2", weight: "400" },
    { path: "../public/fonts/ibm-plex-mono-normal-500.woff2", weight: "500" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});
