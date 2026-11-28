"""About（琥珀の居住地）/ Contact（交信の谷）/ 404（未踏の灰月）の景色。"""

import math
import random

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

import common as c

# +Y を回転軸にして作った形を +Z 向きに立てる
UP = Matrix.Rotation(math.radians(90), 4, "X")


def smooth(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def sphere(name, center, radius, mat, subdivisions=4, smooth_faces=True):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=radius)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    if smooth_faces:
        mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = center
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------- About


def dome(x, y, z, radius, shell, strut, window):
    """格子の梁を持つ居住ドーム。基部に灯りの窓が並ぶ。"""
    sphere("dome", (x, y, z), radius, shell, 4, False)
    frame = sphere("frame", (x, y, z), radius * 1.012, strut, 3, False)
    mod = frame.modifiers.new("wire", "WIREFRAME")
    mod.thickness = radius * 0.028
    skirt = [(radius * 1.05, 0.0), (radius * 1.02, radius * 0.22), (radius * 0.98, radius * 0.24)]
    c.lathe("skirt", skirt, strut, 64, Matrix.Translation((x, y, z)) @ UP)
    count = int(radius * 9)
    for k in range(count):
        if k % 5 == 0:
            continue
        a = math.tau * k / count
        at = Matrix.Translation((x + radius * 1.052 * math.cos(a), y + radius * 1.052 * math.sin(a), z + radius * 0.11))
        c.box("window", (0.06, 0.24, radius * 0.07), window, at @ Matrix.Rotation(a, 4, "Z"))


def scene_about(variant):
    """夕暮れの砂丘と、灯りのともる居住ドーム。低い太陽と 2 つの月。"""
    wide = variant == "wide"
    haze = c.srgb(150, 76, 40)
    sun_u = 0.43 if wide else 0.22
    th = 0.5625 if wide else 0.346
    c.sky_world(
        [
            (0.0, c.srgb(232, 136, 62)),
            (0.045, c.srgb(160, 76, 40)),
            (0.12, c.srgb(84, 38, 30)),
            (0.26, c.srgb(34, 17, 20)),
            (0.6, c.srgb(10, 6, 11)),
        ],
        glow_dir=((sun_u - 0.5) * 2 * th, 1.0, 0.02),
        glow_color=c.srgb(255, 196, 108),
        glow_power=26.0,
        nebula=c.srgb(34, 14, 14),
        stars=0.7,
    )
    home_y = 52.0 if wide else 66.0
    home_x = ((0.73 if wide else 0.56) - 0.5) * 2 * th * home_y

    def ground(x, y):
        warp = c.fbm(x, y, 0.018, 4, 2.0) * 5.0
        s = (x * 0.46 + y * 0.89) * 0.17 + warp
        t = s % 1.0
        crest = smooth(0.0, 0.74, t) if t < 0.74 else 1.0 - smooth(0.74, 1.0, t)
        big = crest * (1.1 + 1.6 * smooth(20.0, 120.0, y))
        ripple = math.sin((x * 0.9 + y * 0.3) * 5.5 + c.fbm(x, y, 0.3, 3, 8.0) * 4.0) * 0.025
        flat = smooth(9.0, 20.0, math.hypot(x - home_x, y - home_y))
        return big * flat + c.fbm(x, y, 0.05, 4, 6.0) * 0.5 * flat + ripple

    sand = c.material(
        "sand",
        c.srgb(156, 82, 40),
        0.9,
        haze=haze,
        haze_range=(60.0, 520.0),
        variation=(c.srgb(112, 56, 32), 0.07),
        bump=(5.0, 0.18),
    )
    c.terrain("dunes", (-100, 100), (-5, 170), (620, 540), ground, sand, smooth=True)
    far_sand = c.material("far_sand", c.srgb(108, 56, 32), 0.9, haze=haze, haze_range=(60.0, 520.0))
    c.terrain("far", (-900, 900), (169.5, 640), (260, 90), lambda x, y: c.fbm(x, y, 0.012, 5, 5.0) * 6.0, far_sand, True)

    def mesa(name, y0, depth, peak, scale, seed, color, near, far, haze_max):
        def height(x, y):
            envelope = math.sin(math.pi * smooth(0.0, 1.0, (y - y0) / depth)) ** 0.8
            raw = c.ridged(x, y, scale, 8, seed)
            # 頂上を平らにした台地
            flat_top = min(raw, 0.52) + max(0.0, raw - 0.52) * 0.18
            return flat_top**1.5 * peak * envelope - 1.0

        mat = c.material(
            name,
            color,
            0.95,
            haze=haze,
            haze_range=(near, far),
            haze_max=haze_max,
            variation=(c.srgb(60, 28, 22), 0.03),
        )
        c.terrain(name, (-y0 * 1.3, y0 * 1.3), (y0, y0 + depth), (720, 130), height, mat)

    mesa("mesa_near", 260.0, 140.0, 40.0 if wide else 56.0, 0.011, 8.4, c.srgb(104, 48, 32), 80.0, 760.0, 0.72)
    mesa("mesa_far", 520.0, 240.0, 100.0 if wide else 130.0, 0.0055, 2.1, c.srgb(130, 66, 46), 180.0, 920.0, 0.88)

    # 沈む太陽と 2 つの月
    sun_y = 1800.0
    disc = c.glow_material("sundisc", c.srgb(255, 214, 150), 1.6)
    body = sphere("sundisc", ((sun_u - 0.5) * 2 * th * sun_y, sun_y, 76.0 if wide else 120.0), 34.0, disc, 5)
    body.visible_diffuse = False
    body.visible_glossy = False
    moon_z = (360.0, 520.0) if wide else (900.0, 1130.0)
    for u, z, radius in ((0.62, moon_z[0], 70.0), (0.86, moon_z[1], 28.0)):
        c.ringed_planet(
            ((u - 0.5) * 2 * th * 2000.0, 2000.0, z),
            radius,
            light_dir=(-0.75, -0.3, -0.35),
            sky_color=c.srgb(34, 17, 20),
            dark=c.srgb(24, 13, 17),
            lit=c.srgb(214, 160, 122),
            rim=c.srgb(255, 206, 160),
            haze=0.25,
        )

    # 居住区
    shell = c.material("dome_shell", c.srgb(120, 96, 84), 0.24, 0.65, variation=(c.srgb(88, 66, 58), 0.8))
    strut = c.material("strut", c.srgb(52, 40, 38), 0.4, 0.8)
    window = c.glow_material("warm_window", c.srgb(255, 188, 96), 6.0)
    beacon = c.glow_material("amber_beacon", c.srgb(255, 130, 60), 9.0)
    domes = ((0.0, 0.0, 6.2), (-9.8, -3.5, 3.4), (8.8, 3.0, 4.1))
    for dx, dy, radius in domes:
        dome(home_x + dx, home_y + dy, 0.0, radius, shell, strut, window)
        c.point((home_x + dx, home_y + dy - radius - 1.0, 1.0), c.srgb(255, 170, 80), radius * 40.0, 0.5)
    for dx, dy, _ in domes[1:]:
        c.beam("tube", (home_x, home_y, 0.9), (home_x + dx, home_y + dy, 0.9), 0.95, shell, 24)
    mast_x, mast_y = home_x + 4.5, home_y + 6.0
    c.beam("mast", (mast_x, mast_y, 0), (mast_x, mast_y, 12.5), 0.14, strut)
    tilt = Matrix.Translation((mast_x, mast_y, 11.0)) @ Matrix.Rotation(math.radians(70), 4, "X")
    c.lathe("dish", [(0, 0), (0.8, 0.12), (1.4, 0.5)], shell, 40, tilt)
    c.box("beacon", (0.3, 0.3, 0.3), beacon, Matrix.Translation((mast_x, mast_y, 12.6)))
    # 太陽電池の列
    solar = c.material("solar", c.srgb(30, 34, 58), 0.18, 0.8)
    for k in range(5):
        x = home_x - 8.0 + k * 2.7
        y = home_y - 11.0 + k * 0.35
        z = ground(x, y)
        c.beam("post", (x, y, z), (x, y, z + 1.0), 0.07, strut)
        angle = Matrix.Rotation(math.radians(28), 4, "X")
        c.box("panel", (2.3, 1.3, 0.07), solar, Matrix.Translation((x, y, z + 1.15)) @ angle, 0.02)
    # 居住区へ続く灯り
    for k in range(10):
        t = k / 10
        x = home_x * (0.25 + 0.7 * t**1.4) - 1.5
        y = 14.0 + (home_y - 22.0) * t
        z = ground(x, y)
        c.beam("lamp_post", (x, y, z), (x, y, z + 0.55), 0.04, strut)
        c.box("lamp_head", (0.12, 0.12, 0.12), window, Matrix.Translation((x, y, z + 0.6)))
    rock = c.material("ochre_rock", c.srgb(92, 48, 30), 0.9, haze=haze, haze_range=(60.0, 520.0), bump=(3.0, 0.5))
    c.rocks(
        21,
        160,
        ((-30, 30), (9, 60)),
        (0.05, 0.9),
        rock,
        ground,
        keep=lambda x, y: math.hypot(x - home_x, y - home_y) > 14.0,
    )

    c.sun(((sun_u - 0.5) * 2.4, 0.55, 0.2), c.srgb(255, 168, 96), 3.2, 1.2)
    c.sun((0.5, -0.6, 0.5), c.srgb(150, 130, 220), 0.5, 10.0)


# ---------------------------------------------------------------- Contact


def aurora(seed, y, x_range, base, height, color, strength):
    """ゆるく波打つ光の幕。下の縁が明るく、上へ消える。"""
    mat = bpy.data.materials.new("aurora")
    n = c.Nodes(mat.node_tree)
    uv = n.add("ShaderNodeUVMap").outputs["UV"]
    xyz = n.add("ShaderNodeSeparateXYZ")
    n.link(uv, xyz.inputs[0])
    u, v = xyz.outputs["X"], xyz.outputs["Y"]
    streak_pos = n.add("ShaderNodeCombineXYZ")
    n.link(u, streak_pos.inputs["X"])
    streaks = n.ramp(n.noise(streak_pos.outputs[0], 48.0, 4.0, 0.6), [(0.36, (0, 0, 0, 1)), (0.72, (1, 1, 1, 1))])
    fade = n.math("MULTIPLY", n.math("MULTIPLY", v, 9.0, True), n.math("POWER", n.math("SUBTRACT", 1.0, v, True), 2.4))
    ends = n.math("MULTIPLY", n.math("MULTIPLY", u, n.math("SUBTRACT", 1.0, u)), 4.0, True)
    alpha = n.math("MULTIPLY", n.math("MULTIPLY", fade, ends), n.math("ADD", streaks, 0.18, True))
    emission = n.add("ShaderNodeEmission")
    emission.inputs["Color"].default_value = color
    n.link(n.math("MULTIPLY", alpha, strength), emission.inputs["Strength"])
    clear = n.add("ShaderNodeBsdfTransparent")
    both = n.add("ShaderNodeAddShader")
    n.link(clear.outputs[0], both.inputs[0])
    n.link(emission.outputs[0], both.inputs[1])
    out = n.add("ShaderNodeOutputMaterial")
    n.link(both.outputs[0], out.inputs["Surface"])

    phase = random.Random(seed).uniform(0, math.tau)
    columns = 220
    verts, faces = [], []
    for i in range(columns + 1):
        t = i / columns
        x = x_range[0] + (x_range[1] - x_range[0]) * t
        wave = math.sin(t * 9.0 + phase) * 0.6 + math.sin(t * 23.0 + phase * 2) * 0.25
        yy = y + wave * 70.0
        z = base + wave * height * 0.2
        verts += [(x, yy, z), (x, yy + 40.0, z + height)]
    for i in range(columns):
        faces.append((i * 2, i * 2 + 2, i * 2 + 3, i * 2 + 1))
    obj = c.mesh_object("aurora", verts, faces, mat)
    layer = obj.data.uv_layers.new(name="UVMap")
    for loop in obj.data.loops:
        index = loop.vertex_index
        layer.data[loop.index].uv = ((index // 2) / columns, float(index % 2))
    obj.visible_shadow = False
    obj.visible_diffuse = False


def big_dish(origin, radius, yaw, tilt, shell, strut, light):
    """支柱の上の大きなパラボラ。焦点の受信機と、空へ向かう信号の輪。"""
    ox, oy, oz = origin
    pivot = Vector((ox, oy, oz + radius * 1.15))
    for dx, dy in ((-0.5, -0.4), (0.5, -0.4), (0.0, 0.55)):
        c.beam("leg", (ox + dx * radius, oy + dy * radius, oz), pivot, radius * 0.055, strut)
    base = [(0, 0), (radius * 0.72, 0), (radius * 0.6, radius * 0.2), (0, radius * 0.2)]
    c.lathe("base", base, strut, 48, Matrix.Translation((ox, oy, oz)) @ UP)
    # 軸は +Y。tilt で手前上に向ける
    aim = Matrix.Translation(pivot) @ Matrix.Rotation(yaw, 4, "Z") @ Matrix.Rotation(tilt, 4, "X")
    depth = radius * 0.34
    profile = [(radius * i / 20, depth * (i / 20) ** 2) for i in range(21)]
    c.lathe("reflector", profile, shell, 96, aim)
    for i in (7, 14, 20):
        ring = aim @ Matrix.Translation((0, depth * (i / 20) ** 2 + 0.03, 0))
        c.torus("rib", radius * i / 20, radius * 0.014, strut, ring)
    focus = Vector((0, radius * 0.92, 0))
    for k in range(4):
        a = math.tau * k / 4 + math.pi / 4
        rim = Vector((radius * 0.92 * math.cos(a), depth * 0.85, radius * 0.92 * math.sin(a)))
        c.beam("strut", aim @ rim, aim @ focus, radius * 0.012, strut)
    c.box("receiver", (radius * 0.12, radius * 0.16, radius * 0.12), strut, aim @ Matrix.Translation(focus), 0.05)
    c.box("receiver_light", (radius * 0.05,) * 3, light, aim @ Matrix.Translation(focus + Vector((0, radius * 0.11, 0))))
    for k in range(1, 4):
        pulse = aim @ Matrix.Translation(focus + Vector((0, radius * 0.42 * k, 0)))
        c.torus("pulse", radius * (0.1 + 0.09 * k), radius * 0.006 / k, light, pulse)
    c.point(aim @ (focus + Vector((0, 0.5, 0))), c.srgb(130, 170, 255), radius * 90.0, 0.5)


def scene_contact(variant):
    """夜の渓谷。右の台地のパラボラが空へ信号を送り、遠くに中継灯が続く。"""
    wide = variant == "wide"
    haze = c.srgb(48, 54, 128)
    c.sky_world(
        [
            (0.0, c.srgb(102, 112, 214)),
            (0.05, c.srgb(60, 66, 154)),
            (0.14, c.srgb(27, 30, 86)),
            (0.3, c.srgb(10, 12, 38)),
            (0.6, c.srgb(4, 5, 16)),
        ],
        glow_dir=(-0.05, 1.0, 0.02),
        glow_color=c.srgb(150, 170, 255),
        glow_power=22.0,
        nebula=c.srgb(18, 18, 52),
        stars=1.3,
    )
    aurora(3, 900.0, (-700, 500), 190.0 if wide else 330.0, 240.0 if wide else 380.0, c.srgb(90, 120, 255), 0.85)
    aurora(9, 1100.0, (-300, 800), 290.0 if wide else 520.0, 260.0 if wide else 420.0, c.srgb(170, 130, 255), 0.55)

    th = 0.5625 if wide else 0.346
    mesa_y = 66.0 if wide else 80.0
    mesa_x = ((0.8 if wide else 0.68) - 0.5) * 2 * th * mesa_y
    mesa_z = 3.2

    def centre(y):
        return math.sin(y * 0.014) * 12.0 - 2.0

    def ground(x, y):
        half = (15.0 if wide else 9.0) + y * 0.04
        d = abs(x - centre(y)) - half + c.fbm(x, y, 0.045, 5, 4.0) * 7.0
        rise = smooth(0.0, 26.0, d)
        wall = rise * (11.0 + c.ridged(x, y, 0.017, 7, 3.3) * (22.0 + y * 0.08)) * smooth(18.0, 75.0, y)
        # 地層の段
        step = 3.4
        level = wall / step
        terraced = (math.floor(level) + smooth(0.55, 1.0, level % 1.0)) * step
        floor = c.fbm(x, y, 0.08, 5, 1.0) * 0.8
        height = floor + terraced + c.fbm(x, y, 0.3, 4, 7.0) * 0.35
        # パラボラの台地
        pad = 1.0 - smooth(7.0, 11.0, math.hypot(x - mesa_x, y - mesa_y))
        return height * (1.0 - pad) + mesa_z * pad

    rock = c.material(
        "indigo_rock",
        c.srgb(44, 46, 90),
        0.88,
        haze=haze,
        haze_range=(50.0, 480.0),
        variation=(c.srgb(24, 25, 54), 0.12),
        bump=(1.3, 0.55),
    )
    c.terrain("canyon", (-130, 130), (-5, 300), (620, 700), ground, rock)

    def far_ridge(x, y):
        envelope = math.sin(math.pi * smooth(0.0, 1.0, (y - 299.0) / 220.0)) ** 0.8
        valley = 1.0 - 0.65 * math.exp(-((x / 90.0) ** 2))
        return c.ridged(x, y, 0.009, 8, 6.6) ** 1.35 * 80.0 * envelope * valley

    distant = c.material("distant", c.srgb(58, 62, 120), 0.9, haze=haze, haze_range=(120.0, 640.0), haze_max=0.85)
    c.terrain("distant", (-520, 520), (299, 519), (560, 130), far_ridge, distant)

    shell = c.material("dish_shell", c.srgb(168, 176, 206), 0.34, 0.6, variation=(c.srgb(128, 134, 168), 1.2), bump=(6.0, 0.05))
    strut = c.material("dish_strut", c.srgb(62, 66, 100), 0.4, 0.8)
    light = c.glow_material("signal", c.srgb(140, 160, 255), 2.2)
    relay = c.glow_material("relay", c.srgb(196, 181, 253), 8.0)
    big_dish((mesa_x, mesa_y, mesa_z), 6.4 if wide else 5.2, math.radians(34), math.radians(38), shell, strut, light)
    # 皿の内側を起こす光
    c.point((mesa_x - 9.0, mesa_y - 9.0, mesa_z + 11.0), c.srgb(170, 190, 255), 1500.0, 2.0)
    window = c.glow_material("hut_window", c.srgb(255, 206, 150), 5.0)
    c.box("hut", (4.2, 2.8, 2.0), strut, Matrix.Translation((mesa_x - 6.4, mesa_y - 2.0, mesa_z + 1.0)), 0.15)
    for k in range(3):
        c.box("hut_window", (0.6, 0.05, 0.4), window, Matrix.Translation((mesa_x - 7.6 + k * 1.2, mesa_y - 3.43, mesa_z + 1.1)))
    # 谷底を奥へ続く中継灯
    for k in range(9):
        y = 24.0 + k * k * 2.6 + k * 8.0
        x = centre(y) + (3.5 if k % 2 else -3.5)
        z = ground(x, y)
        c.beam("relay_post", (x, y, z), (x, y, z + 2.2), 0.08, strut)
        c.box("relay_lamp", (0.28, 0.28, 0.28), relay, Matrix.Translation((x, y, z + 2.35)))
        if k < 4:
            c.point((x, y - 0.4, z + 2.4), c.srgb(170, 160, 255), 70.0, 0.2)
    pebble = c.material("pebble", c.srgb(40, 42, 82), 0.85, haze=haze, haze_range=(50.0, 480.0), bump=(3.0, 0.4))
    c.rocks(
        31,
        420,
        ((-22, 20), (9, 80)),
        (0.05, 0.9),
        pebble,
        ground,
        keep=lambda x, y: math.hypot(x - mesa_x, y - mesa_y) > 10.0,
    )

    c.sun((-0.55, 0.45, 0.42), c.srgb(140, 160, 255), 2.2, 2.0)
    c.sun((0.4, -0.75, 0.45), c.srgb(170, 150, 235), 0.7, 8.0)


# ---------------------------------------------------------------- 404


def scene_404(variant):
    """空気のない灰色の月面。傾いた探査機の赤い灯りだけが点いている。遠くに細い地球型惑星。"""
    wide = variant == "wide"
    c.sky_world(
        [
            (0.0, c.srgb(24, 23, 27)),
            (0.12, c.srgb(10, 10, 14)),
            (0.6, c.srgb(3, 3, 6)),
        ],
        glow_dir=(0.6, 1.0, 0.02),
        glow_color=c.srgb(70, 66, 70),
        glow_power=10.0,
        nebula=c.srgb(16, 15, 20),
        stars=1.5,
    )
    rng = random.Random(404)
    craters = [(-10.0 if wide else -5.0, 44.0, 9.0), (14.0, 70.0, 14.0)]
    for _ in range(190):
        y = 8.0 + rng.random() ** 1.4 * 190.0
        craters.append((rng.uniform(-100, 100), y, 0.5 + rng.random() ** 3 * 8.0))

    def ground(x, y):
        h = c.fbm(x, y, 0.025, 5, 4.4) * 2.2 + c.fbm(x, y, 0.25, 5, 2.2) * 0.22
        for cx, cy, r in craters:
            if abs(x - cx) > r * 1.9 or abs(y - cy) > r * 1.9:
                continue
            d = math.hypot(x - cx, y - cy) / r
            bowl = (d * d - 1.0) * r * 0.2 if d < 1.0 else 0.0
            rim = math.exp(-(((d - 1.05) / 0.26) ** 2)) * r * 0.075
            h += bowl + rim
        return h

    dust = c.material("regolith", c.srgb(112, 108, 108), 0.95, variation=(c.srgb(74, 71, 74), 0.09), bump=(3.5, 0.45))
    c.terrain("moon", (-110, 110), (-5, 210), (720, 700), ground, dust)
    c.terrain("far", (-1100, 1100), (209.5, 900), (280, 90), lambda x, y: c.fbm(x, y, 0.01, 5, 9.0) * 8.0 - 2.0, dust)

    def rim_ridge(x, y):
        envelope = math.sin(math.pi * smooth(0.0, 1.0, (y - 330.0) / 160.0)) ** 0.8
        return c.ridged(x, y, 0.007, 7, 1.4) ** 1.5 * 44.0 * envelope - 1.0

    c.terrain("rim", (-460, 460), (330, 490), (620, 110), rim_ridge, dust)
    stone = c.material("boulder", c.srgb(92, 88, 90), 0.9, bump=(3.0, 0.5))
    c.rocks(41, 1100, ((-40, 40), (8, 100)), (0.05, 1.0), stone, ground)

    th = 0.5625 if wide else 0.346
    planet_u, planet_z = (0.83, 420.0) if wide else (0.7, 1010.0)
    c.ringed_planet(
        ((planet_u - 0.5) * 2 * th * 2000.0, 2000.0, planet_z),
        105.0 if wide else 120.0,
        light_dir=(0.9, 0.25, -0.2),
        sky_color=c.srgb(8, 9, 16),
        dark=c.srgb(10, 12, 22),
        lit=c.srgb(120, 160, 214),
        rim=c.srgb(180, 214, 255),
        haze=0.05,
    )

    # 不時着した探査機
    probe_y = 25.0 if wide else 22.0
    probe_x = ((0.17 if wide else 0.52) - 0.5) * 2 * th * probe_y
    base = ground(probe_x, probe_y)
    lean = Euler((math.radians(14), math.radians(-19), math.radians(28))).to_matrix().to_4x4()
    body = Matrix.Translation((probe_x, probe_y, base + 0.9)) @ lean
    foil = c.material("probe_foil", c.srgb(172, 140, 88), 0.38, 1.0, bump=(9.0, 0.4))
    metal = c.material("probe_metal", c.srgb(140, 142, 150), 0.35, 0.85, bump=(12.0, 0.1))
    solar = c.material("probe_solar", c.srgb(26, 32, 52), 0.2, 0.8)
    red = c.glow_material("probe_red", c.srgb(255, 72, 72), 14.0)
    c.box("bus", (2.2, 1.9, 1.5), foil, body, 0.16)
    c.box("deck", (2.4, 2.1, 0.14), metal, body @ Matrix.Translation((0, 0, 0.82)), 0.04)
    for k in range(4):
        offset = Matrix.Translation((1.5 + k * 0.78, 0, -0.1 - k * k * 0.05))
        bend = Matrix.Rotation(math.radians(k * 7), 4, "Y")
        c.box("cell", (0.72, 1.35, 0.06), solar, body @ offset @ bend, 0.015)
    c.beam("boom", body @ Vector((1.0, 0, 0)), body @ Vector((4.2, 0, -0.55)), 0.05, metal)
    aim = body @ Matrix.Translation((-0.5, 0, 1.55)) @ Matrix.Rotation(math.radians(62), 4, "X")
    c.lathe("probe_dish", [(0, 0), (0.55, 0.09), (1.0, 0.34)], metal, 56, aim)
    c.beam("dish_arm", body @ Vector((-0.5, 0, 0.8)), body @ Vector((-0.5, 0, 1.6)), 0.07, metal)
    c.beam("antenna", body @ Vector((0.6, 0.3, 0.8)), body @ Vector((1.1, 0.3, 3.0)), 0.03, metal)
    c.box("lamp", (0.14, 0.14, 0.14), red, body @ Matrix.Translation((1.1, 0.3, 3.05)))
    c.point(body @ Vector((1.1, -0.1, 3.3)), c.srgb(255, 80, 80), 35.0, 0.15)
    for side in (-1, 1):
        c.beam("strut", body @ Vector((side * 0.8, -0.7, -0.6)), body @ Vector((side * 1.7, -1.4, -1.35)), 0.06, metal)

    # 横から差す硬い日差し + 手前をわずかに起こす光
    c.sun((0.85, 0.12, 0.26), c.srgb(255, 244, 230), 2.7, 0.5)
    c.sun((-0.5, -0.7, 0.5), c.srgb(110, 120, 160), 0.22, 10.0)
