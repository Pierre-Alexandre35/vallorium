export const gameVisuals = {
  pageBackground:
    "radial-gradient(circle at 10% 0%, rgba(255,255,255,.9) 0, transparent 28rem), linear-gradient(180deg, #f8f4eb 0%, #f6f1e6 100%)",
  auth: {
    background:
      "radial-gradient(circle at 72% 18%, rgba(244, 194, 80, .24), transparent 17rem), linear-gradient(145deg, #193d29 0%, #28553a 45%, #163321 100%)",
    mapBackground:
      "radial-gradient(circle at 47% 43%, #d8c17d 0 18%, #92ae5d 19% 45%, #56723f 46% 62%, #314f32 63% 100%)",
    mapBorder: "rgba(229, 205, 146, .3)",
    fieldBorder: "rgba(255,255,255,.55)",
    centerBackground: "#ead69b",
  },
  village: {
    panelBackground:
      "radial-gradient(circle at 50% 45%, rgba(255,255,255,.92) 0 18%, rgba(226,232,189,.75) 19% 40%, rgba(194,211,146,.55) 41% 58%, transparent 59%), linear-gradient(180deg, #fdfbf3 0%, #f4eedf 100%)",
    mapBackground:
      "radial-gradient(circle at 50% 50%, #e3d19e 0 18%, #d8df9f 19% 39%, #94b36c 40% 62%, #627e4d 63% 100%)",
    fieldsBackground:
      "repeating-conic-gradient(from 12deg, #d3b779 0 12deg, #c9aa69 12deg 24deg)",
    centerBackground: "linear-gradient(145deg, #f6e6ae, #d5ba74)",
    mapBorder: "rgba(76, 93, 56, .18)",
    roadBorder: "rgba(124, 91, 47, .58)",
    roadBackground: "rgba(222, 202, 145, .72)",
  },
  noiseDataUri:
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
} as const;
