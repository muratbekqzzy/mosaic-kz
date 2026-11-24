"""
SCENE 2b render — a polished stone slab is cut along glowing brass lines, the tiles
lift, turn in the light, and settle into a spaced grid.

Output: public/seq/split/0001.webp … (transparent, so the page colour shows through).
Run:  blender -b -P scripts/blender/render_split.py -- <project_root> [stone] [frames] [samples]
"""
import math
import os
import random
import sys

sys.path.append(os.path.dirname(__file__))
import bpy  # noqa: E402
import common as C  # noqa: E402

a = C.args()
ROOT = a[0] if a else os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STONE = a[1] if len(a) > 1 else "carrara"
FRAMES = int(a[2]) if len(a) > 2 else 72
SAMPLES = int(a[3]) if len(a) > 3 else 40
OUT = os.path.join(ROOT, "public", "seq", "split")
os.makedirs(OUT, exist_ok=True)

COLS, ROWS = 6, 4
T = 0.3  # tile size (m)
THICK = 0.06
GAP = 0.03  # final spacing
W, H = COLS * T, ROWS * T
random.seed(7)

scene = C.reset_scene()
C.setup_cycles(scene, samples=SAMPLES, res=(1440, 900), transparent=True)
scene.frame_start, scene.frame_end = 1, FRAMES
scene.render.fps = 24
C.world(scene, "#2A221B", 0.3)

stone = C.stone_material("Stone", ROOT, STONE, roughness=0.28, coat=0.5)
glow = C.emission_material("#EBCB8E", 10)
C.shadow_catcher(30)

# timing (fractions of the clip)
f = lambda x: 1 + round(x * (FRAMES - 1))  # noqa: E731
CUT0, CUT1 = f(0.02), f(0.24)
LIFT, SPREAD, SETTLE = f(0.3), f(0.58), f(0.86)

# tiles: one slab, UV-continuous, so the cut reveals one stone pattern breaking apart
tiles = []
for r in range(ROWS):
    for c in range(COLS):
        x0 = (c - (COLS - 1) / 2) * T
        y0 = (r - (ROWS - 1) / 2) * T
        h = T / 2 - 0.0008
        pts = [(-h, -h), (h, -h), (h, h), (-h, h)]
        uv = (-W / 2 - x0, -H / 2 - y0, W, H)  # local → slab UV
        ob = C.prism_from_outline(f"Tile_{r}_{c}", pts, THICK, uv_rect=uv, bevel=0.004)
        ob.data.materials.append(stone)
        ob.location = (x0, y0, 0)
        tiles.append((ob, c, r, x0, y0))

for ob, c, r, x0, y0 in tiles:
    d = random.random()
    delay = round(d * FRAMES * 0.08)
    sx = (c - (COLS - 1) / 2) * (T + GAP)
    sy = (r - (ROWS - 1) / 2) * (T + GAP)
    rot = [random.uniform(-0.22, 0.22), random.uniform(-0.22, 0.22), random.uniform(-0.12, 0.12)]

    def key(frame, loc, rr):
        ob.location = loc
        ob.rotation_euler = rr
        ob.keyframe_insert("location", frame=frame)
        ob.keyframe_insert("rotation_euler", frame=frame)

    key(1, (x0, y0, 0), (0, 0, 0))
    key(LIFT + delay, (x0, y0, 0), (0, 0, 0))
    key(SPREAD + delay, (sx * 1.28, sy * 1.28, 0.16 + d * 0.1), rot)
    key(min(FRAMES, SETTLE + delay), (sx, sy, 0), (0, 0, 0))

# glowing brass cut lines in the joints (draw in, then vanish as the slab parts)
lines = []
for c in range(1, COLS):
    x = -W / 2 + c * T
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, THICK + 0.002))
    ln = bpy.context.active_object
    ln.scale = (0.0035, H, 0.003)
    lines.append((ln, "y", c / COLS))
for r in range(1, ROWS):
    y = -H / 2 + r * T
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, y, THICK + 0.002))
    ln = bpy.context.active_object
    ln.scale = (W, 0.0035, 0.003)
    lines.append((ln, "x", r / ROWS))
for ln, axis, k in lines:
    ln.data.materials.append(glow)
    full = tuple(ln.scale)
    zero = (0.0001, full[1], full[2]) if axis == "x" else (full[0], 0.0001, full[2])
    start = CUT0 + round(k * (CUT1 - CUT0) * 0.5)
    ln.scale = zero
    ln.keyframe_insert("scale", frame=1)
    ln.keyframe_insert("scale", frame=start)
    ln.scale = full
    ln.keyframe_insert("scale", frame=start + round((CUT1 - CUT0) * 0.5))
    ln.keyframe_insert("scale", frame=LIFT)
    ln.scale = (0.0001, 0.0001, 0.0001)
    ln.keyframe_insert("scale", frame=LIFT + 4)

# light: warm raking key from the left, cool rim from behind, soft top fill
C.area_light("Key", (-2.6, -0.8, 1.2), (60, 0, -70), 1.6, 220, "#FFE2BC")
C.area_light("Rim", (1.8, 2.4, 1.6), (-55, 0, 145), 2.0, 140, "#E9EEF5")
C.area_light("Top", (0, 0, 3.2), (0, 0, 0), 3.0, 60, "#FFF4E6")

cam, target = C.camera((0.0, -2.55, 2.35), (0, 0.05, 0.02), lens=42, fstop=3.2)
# slow push-in across the shot
cam.location = (0.0, -2.75, 2.5)
cam.keyframe_insert("location", frame=1)
cam.location = (0.0, -2.35, 2.15)
cam.keyframe_insert("location", frame=FRAMES)

scene.render.filepath = os.path.join(OUT, "####")
print(f"Rendering {FRAMES} frames of {STONE} → {OUT}")
bpy.ops.render.render(animation=True)
print("DONE")
