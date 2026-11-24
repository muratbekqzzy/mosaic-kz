"""
Shared helpers for the MOSAIC.KZ Blender renders (Cycles, photoreal).
Works with Blender 4.x and 5.x.
"""
import math
import os
import sys

import bpy
import bmesh


def args():
    """Arguments after `--` on the blender command line."""
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def setup_cycles(scene, samples=64, res=(1440, 900), transparent=True):
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.use_denoising = True
    try:
        scene.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    # Apple Silicon GPU
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = "GPU"
    except Exception:
        scene.cycles.device = "CPU"
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = transparent
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    scene.render.image_settings.quality = 82
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass


def hex_to_linear(h):
    h = h.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def world(scene, color="#2A221B", strength=0.35):
    w = bpy.data.worlds.new("World")
    scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs[0].default_value = hex_to_linear(color)
    bg.inputs[1].default_value = strength


def _set(bsdf, names, value):
    for n in names if isinstance(names, (list, tuple)) else [names]:
        if n in bsdf.inputs:
            bsdf.inputs[n].default_value = value
            return


def stone_material(name, project_root, stone="carrara", roughness=0.3, coat=0.45, tint="#FFFFFF"):
    """Principled stone: the real photo texture if present, else a procedural marble."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    _set(bsdf, "Roughness", roughness)
    _set(bsdf, ["Coat Weight", "Clearcoat"], coat)
    _set(bsdf, ["Coat Roughness", "Clearcoat Roughness"], 0.08)
    _set(bsdf, ["Specular IOR Level", "Specular"], 0.5)

    img_path = None
    for ext in ("jpg", "png", "webp"):
        p = os.path.join(project_root, "public", "textures", f"{stone}.{ext}")
        if os.path.exists(p):
            img_path = p
            break

    if img_path:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(img_path)
        tex.interpolation = "Cubic"
        color_out = tex.outputs["Color"]
    else:
        # procedural fallback: warped wave veins over a soft base
        coord = nt.nodes.new("ShaderNodeTexCoord")
        noise = nt.nodes.new("ShaderNodeTexNoise")
        nt.links.new(coord.outputs["UV"], noise.inputs["Vector"])
        noise.inputs["Scale"].default_value = 2.2
        noise.inputs["Detail"].default_value = 8
        wave = nt.nodes.new("ShaderNodeTexWave")
        wave.inputs["Scale"].default_value = 1.6
        wave.inputs["Distortion"].default_value = 9
        wave.inputs["Detail"].default_value = 6
        nt.links.new(noise.outputs["Fac"], wave.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        palettes = {
            "carrara": ("#F1EEE9", "#8D8E93"),
            "travertine": ("#D8C8AE", "#A68E6C"),
            "onyx": ("#F2CE8E", "#A9642A"),
            "sage": ("#7E8F7A", "#E5E8DE"),
            "nero": ("#1E1C1B", "#E2DDD4"),
        }
        a, b = palettes.get(stone, palettes["carrara"])
        ramp.color_ramp.elements[0].color = hex_to_linear(a)
        ramp.color_ramp.elements[1].color = hex_to_linear(b)
        ramp.color_ramp.elements[0].position = 0.72
        nt.links.new(wave.outputs["Fac"], ramp.inputs["Fac"])
        color_out = ramp.outputs["Color"]

    if tint.upper() != "#FFFFFF":
        mix = nt.nodes.new("ShaderNodeMixRGB")
        mix.blend_type = "MULTIPLY"
        mix.inputs["Fac"].default_value = 1.0
        mix.inputs["Color2"].default_value = hex_to_linear(tint)
        nt.links.new(color_out, mix.inputs["Color1"])
        color_out = mix.outputs["Color"]

    nt.links.new(color_out, bsdf.inputs["Base Color"])
    # micro relief from the texture itself
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.04
    nt.links.new(color_out, bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def brass_material():
    m = bpy.data.materials.new("Brass")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    _set(b, "Base Color", hex_to_linear("#C9A061"))
    _set(b, "Metallic", 1.0)
    _set(b, "Roughness", 0.22)
    return m


def emission_material(color="#EBCB8E", strength=8):
    m = bpy.data.materials.new("Glow")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        if n.type == "BSDF_PRINCIPLED":
            nt.nodes.remove(n)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = hex_to_linear(color)
    e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs["Emission"], nt.nodes["Material Output"].inputs["Surface"])
    return m


def prism_from_outline(name, pts, depth, uv_rect=None, bevel=0.0025):
    """Extruded tile from a 2D outline (list of (x, y)). UVs map xy into uv_rect=(x0, y0, w, h)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bottom = [bm.verts.new((x, y, 0)) for x, y in pts]
    face = bm.faces.new(bottom)
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    top = [v for v in ext["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=top, vec=(0, 0, depth))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv = bm.loops.layers.uv.new()
    x0, y0, w, h = uv_rect or (min(p[0] for p in pts), min(p[1] for p in pts), 1, 1)
    for f in bm.faces:
        for loop in f.loops:
            co = loop.vert.co
            loop[uv].uv = ((co.x - x0) / w, (co.y - y0) / h)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if bevel > 0:
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
    for p in me.polygons:
        p.use_smooth = False
    return ob


def petal_outline(length=1.0, width=0.46, steps=18):
    """Same petal as the website (lib/shapes.ts), sampled from its two cubic Béziers."""
    w = width / 2

    def cubic(p0, p1, p2, p3, t):
        u = 1 - t
        return tuple(u**3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t**3 * d for a, b, c, d in zip(p0, p1, p2, p3))

    right = [cubic((0, 0), (w * 1.25, length * 0.18), (w * 1.15, length * 0.7), (0, length), i / steps) for i in range(steps)]
    left = [cubic((0, length), (-w * 1.15, length * 0.7), (-w * 1.25, length * 0.18), (0, 0), i / steps) for i in range(steps)]
    return right + left


def area_light(name, loc, rot, size, energy, color="#FFE4C2"):
    data = bpy.data.lights.new(name, "AREA")
    data.size = size
    data.energy = energy
    data.color = hex_to_linear(color)[:3]
    ob = bpy.data.objects.new(name, data)
    ob.location = loc
    ob.rotation_euler = [math.radians(a) for a in rot]
    bpy.context.scene.collection.objects.link(ob)
    return ob


def camera(loc, look_at=(0, 0, 0), lens=50, fstop=None, focus=None):
    data = bpy.data.cameras.new("Cam")
    data.lens = lens
    ob = bpy.data.objects.new("Cam", data)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    target = bpy.data.objects.new("Target", None)
    target.location = look_at
    bpy.context.scene.collection.objects.link(target)
    c = ob.constraints.new("TRACK_TO")
    c.target = target
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"
    if fstop:
        data.dof.use_dof = True
        data.dof.aperture_fstop = fstop
        data.dof.focus_object = target if focus is None else focus
    bpy.context.scene.camera = ob
    return ob, target


def shadow_catcher(size=20):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    p = bpy.context.active_object
    p.name = "ShadowCatcher"
    p.is_shadow_catcher = True
    return p
