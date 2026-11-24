"""
Collection renders — one photoreal 30 × 30 cm mosaic sheet per collection, floating at a
slight angle in raking light, on a transparent background with its soft contact shadow.

Output: public/images/sheets/<collection>.webp
Run:  blender -b -P scripts/blender/render_sheets.py -- <project_root> [samples] [only_id]
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
SAMPLES = int(a[1]) if len(a) > 1 else 96
ONLY = a[2] if len(a) > 2 else None
OUT = os.path.join(ROOT, "public", "images", "sheets")
os.makedirs(OUT, exist_ok=True)

S = 0.3  # sheet size, metres
CHIP_D = 0.008

# collection id → (pattern, primary stone, secondary stone)
SHEETS = {
    "flora": ("flora", "carrara", "sage"),
    "geometry": ("hex", "nero", "carrara"),
    "classic": ("square", "carrara", "onyx"),
    "arabesque": ("arabesque", "carrara", "sage"),
    "flex": ("flex", "onyx", "travertine"),
}


def uvr():
    return (-S / 2, -S / 2, S, S)


def place(ob, x, y, rot=0.0, mat=None):
    ob.location = (x, y, 0.004)
    ob.rotation_euler = (0, 0, rot)
    if mat:
        ob.data.materials.append(mat)
    return ob


def outline_square(s):
    h = s / 2
    return [(-h, -h), (h, -h), (h, h), (-h, h)]


def outline_hex(r):
    return [(math.cos(math.pi / 6 + i * math.pi / 3) * r, math.sin(math.pi / 6 + i * math.pi / 3) * r) for i in range(6)]


def outline_arabesque(h):
    # lantern: same curve as the website's arabesque tile, sampled
    k = h / 100
    P = lambda x, y: ((x - 50) * k, (50 - y) * k)  # noqa: E731
    segs = [
        ((50, 0), (62, 12), (78, 14), (78, 30)),
        ((78, 30), (78, 42), (68, 46), (68, 50)),
        ((68, 50), (68, 54), (78, 58), (78, 70)),
        ((78, 70), (78, 86), (62, 88), (50, 100)),
        ((50, 100), (38, 88), (22, 86), (22, 70)),
        ((22, 70), (22, 58), (32, 54), (32, 50)),
        ((32, 50), (32, 46), (22, 42), (22, 30)),
        ((22, 30), (22, 14), (38, 12), (50, 0)),
    ]
    pts = []
    for p0, p1, p2, p3 in segs:
        for i in range(8):
            t = i / 8
            u = 1 - t
            x = u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0]
            y = u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]
            pts.append(P(x, y))
    return pts


def build(pattern, m1, m2, brass):
    random.seed(3)
    objs = []
    # grout bed
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.002))
    bed = bpy.context.active_object
    bed.scale = (S, S, 0.004)
    gm = bpy.data.materials.new("Grout")
    gm.use_nodes = True
    gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = C.hex_to_linear("#CFC5B6")
    gm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
    bed.data.materials.append(gm)
    objs.append(bed)

    if pattern == "square":
        n, gap = 12, 0.0016
        s = (S - gap * (n + 1)) / n
        for r in range(n):
            for c in range(n):
                x = -S / 2 + gap + s / 2 + c * (s + gap)
                y = -S / 2 + gap + s / 2 + r * (s + gap)
                ob = C.prism_from_outline("chip", outline_square(s), CHIP_D, uv_rect=(-S / 2 - x, -S / 2 - y, S, S), bevel=0.0009)
                objs.append(place(ob, x, y, 0, m2 if random.random() > 0.78 else m1))
    elif pattern == "hex":
        r = 0.0125
        w = math.sqrt(3) * r
        for row in range(-1, 16):
            for col in range(-1, 14):
                x = -S / 2 + col * (w + 0.0012) + (row % 2) * (w + 0.0012) / 2
                y = -S / 2 + row * (r * 1.5 + 0.0011)
                if abs(x) > S / 2 - r * 0.6 or abs(y) > S / 2 - r * 0.6:
                    continue
                ob = C.prism_from_outline("hex", outline_hex(r), CHIP_D, uv_rect=(-S / 2 - x, -S / 2 - y, S, S), bevel=0.0008)
                objs.append(place(ob, x, y, 0, m2 if random.random() > 0.82 else m1))
    elif pattern == "flora":
        cell = S / 3
        petal = C.petal_outline(0.042, 0.02)
        for gy in range(3):
            for gx in range(3):
                cx, cy = -S / 2 + cell / 2 + gx * cell, -S / 2 + cell / 2 + gy * cell
                for i in range(8):
                    a_ = i * math.pi / 4
                    ob = C.prism_from_outline("petal", petal, CHIP_D, uv_rect=(-S / 2 - cx, -S / 2 - cy, S, S), bevel=0.0008)
                    place(ob, cx + math.cos(a_) * 0.006, cy + math.sin(a_) * 0.006, a_ - math.pi / 2, m1)
                    objs.append(ob)
                for i in range(8):
                    b_ = i * math.pi / 4 + math.pi / 8
                    ob = C.prism_from_outline("chip", outline_square(0.008), CHIP_D * 0.9, bevel=0.0006)
                    objs.append(place(ob, cx + math.cos(b_) * 0.031, cy + math.sin(b_) * 0.031, b_ + math.pi / 4, m2))
                bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0042, location=(cx, cy, CHIP_D * 0.9))
                dot = bpy.context.active_object
                dot.data.materials.append(brass)
                bpy.ops.object.shade_smooth()
                objs.append(dot)
        # diamonds at the inner grid vertices (the sheet edge stays clean)
        for vy in range(1, 3):
            for vx in range(1, 3):
                x, y = -S / 2 + vx * cell, -S / 2 + vy * cell
                ob = C.prism_from_outline("corner", outline_square(0.024), CHIP_D, uv_rect=(-S / 2 - x, -S / 2 - y, S, S), bevel=0.0008)
                objs.append(place(ob, x, y, math.pi / 4, m2))
    elif pattern == "arabesque":
        h = 0.06
        shape = outline_arabesque(h)
        for col in range(-1, 12):
            for row in range(-1, 6):
                x = -S / 2 + col * 0.0285
                y = -S / 2 + row * h + (col % 2) * h / 2
                if abs(x) > S / 2 - 0.008 or abs(y) > S / 2 - 0.02:
                    continue
                ob = C.prism_from_outline("arab", shape, CHIP_D, uv_rect=(-S / 2 - x, -S / 2 - y, S, S), bevel=0.0008)
                objs.append(place(ob, x, y, 0, m2 if random.random() > 0.85 else m1))
    elif pattern == "flex":
        # a thin stone veneer sheet, curling like paper — the point of flexible marble
        bed.scale = (0.0001, 0.0001, 0.0001)
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=80, y_subdivisions=2, size=S * 1.6, location=(0, 0, 0.0015))
        sheet = bpy.context.active_object
        sheet.scale = (1, 0.62, 1)
        bpy.ops.object.transform_apply(scale=True)
        sol = sheet.modifiers.new("Thick", "SOLIDIFY")
        sol.thickness = 0.002
        bend = sheet.modifiers.new("Bend", "SIMPLE_DEFORM")
        bend.deform_method = "BEND"
        bend.deform_axis = "Y"
        bend.angle = math.radians(150)
        sheet.data.materials.append(m1)
        bpy.ops.object.shade_smooth()
        sheet.location = (0, 0, 0.05)
        sheet.rotation_euler = (0, math.radians(90), 0)
        objs.append(sheet)
    return objs


for cid, (pattern, s1, s2) in SHEETS.items():
    if ONLY and cid != ONLY:
        continue
    scene = C.reset_scene()
    C.setup_cycles(scene, samples=SAMPLES, res=(1400, 1400), transparent=True)
    C.world(scene, "#2A221B", 0.12)
    m1 = C.stone_material("A", ROOT, s1, roughness=0.26, coat=0.55)
    m2 = C.stone_material("B", ROOT, s2, roughness=0.3, coat=0.45)
    brass = C.brass_material()
    parts = build(pattern, m1, m2, brass)

    # float the whole sheet a touch above its shadow, tilted toward the light
    pivot = bpy.data.objects.new("Pivot", None)
    scene.collection.objects.link(pivot)
    for ob in parts:
        ob.parent = pivot
    pivot.location = (0, 0, 0.035)
    pivot.rotation_euler = (math.radians(-6), math.radians(4), math.radians(-8))
    C.shadow_catcher(4)

    # low raking key from the left: every chip edge catches light, every joint holds shadow
    C.area_light("Key", (-0.7, -0.15, 0.16), (78, 0, -78), 0.35, 7, "#FFDDB0")
    C.area_light("Rim", (0.5, 0.6, 0.35), (-55, 0, 140), 0.5, 3, "#EEF2F7")
    C.area_light("Top", (0.1, -0.2, 0.9), (10, 0, 0), 0.8, 1.6, "#FFF6EA")
    C.camera((0.0, -0.4, 0.58), (0, 0.0, 0.02), lens=58, fstop=4)

    scene.render.filepath = os.path.join(OUT, f"{cid}.webp")
    print(f"Rendering {cid} ({pattern}: {s1}/{s2})")
    bpy.ops.render.render(write_still=True)
print("DONE")
