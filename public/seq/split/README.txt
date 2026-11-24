Optional image sequence of a stone block splitting into tiles:
  0001.webp, 0002.webp, … (e.g. 120 frames, 1600×1000, rendered in Blender)
Then set config/site.ts → assets.splitSequence = { count: 120, pattern: (i) => `/seq/split/${String(i + 1).padStart(4, "0")}.webp` }
Until then the scene draws the split procedurally.
