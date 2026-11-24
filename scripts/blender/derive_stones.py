"""
Derives photoreal Nero, sage, onyx and travertine textures from the real Carrara photo
by gradient-mapping its tones (and turning / stretching it so the patterns differ).
Real photos imported later (npm run import-assets) simply overwrite these files.

Run:  blender -b --factory-startup -P scripts/blender/derive_stones.py -- <project_root> [--force]
"""
import os
import sys

import bpy
import numpy as np

a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ROOT = a[0]
FORCE = "--force" in a
TEX = os.path.join(ROOT, "public", "textures")
src = os.path.join(TEX, "carrara.jpg")
img = bpy.data.images.load(src)
w, h = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[:, :, :3]
lum = px @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
lo, hi = np.percentile(lum, 1.5), np.percentile(lum, 99)
t = np.clip((lum - lo) / (hi - lo), 0, 1)  # 0 = darkest vein, 1 = whitest stone


def hexf(c):
    c = c.lstrip("#")
    return np.array([int(c[i:i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)


def srgb_to_lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def gradient(tt, stops):
    """stops: [(pos, '#hex'), ...] in sRGB; returns sRGB floats."""
    pos = np.array([p for p, _ in stops], dtype=np.float32)
    cols = np.stack([hexf(c) for _, c in stops])  # byte images store sRGB values directly
    out = np.empty(tt.shape + (3,), dtype=np.float32)
    for ch in range(3):
        out[..., ch] = np.interp(tt, pos, cols[:, ch])
    return out


def save(name, rgb):
    path = os.path.join(TEX, f"{name}.jpg")
    if os.path.exists(path) and not FORCE:
        print(f"keep existing {name}.jpg")
        return
    hh, ww = rgb.shape[:2]
    out = bpy.data.images.new(name, ww, hh, alpha=False)
    rgba = np.concatenate([rgb, np.ones((hh, ww, 1), dtype=np.float32)], axis=2)
    out.pixels.foreach_set(rgba.ravel())
    out.filepath_raw = path
    out.file_format = "JPEG"
    bpy.context.scene.render.image_settings.quality = 88
    out.save()
    print(f"saved {name}.jpg")


# Nero Marquina: white veins on deep black (inverted Carrara, turned 90°)
tn = np.rot90(t)
save("nero", gradient(tn ** 1.2, [(0.0, "#ECE7DE"), (0.35, "#77726C"), (0.62, "#26231F"), (1.0, "#151312")]))

# Sage marble: grey-green body, pale veins (mirrored)
ts = np.flipud(t)
save("sage", gradient(ts, [(0.0, "#E6EAE0"), (0.4, "#93A28E"), (0.75, "#6E7E6A"), (1.0, "#80907B")]))

# Honey onyx: amber bands with glowing cream veins (turned, gamma-shaped)
to = np.rot90(t, 3) ** 0.7
save("onyx", gradient(to, [(0.0, "#FFF0CF"), (0.3, "#E9B25F"), (0.6, "#B8701F"), (0.85, "#D99A45"), (1.0, "#F0C67E")]))

# Travertine: stretch along x so veins become long horizontal layers, soft contrast
idx = (np.arange(w) / 3.2).astype(int)
tt = t[:, idx]
save("travertine", gradient(tt, [(0.0, "#A88E68"), (0.45, "#C9B593"), (1.0, "#DED0B6")]))
print("DONE")
