"""ページ背景の静止画をレンダリングする。

  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
    -P scripts/blender/render_backgrounds.py -- --page projects --variant wide

--page     projects | detail | about | contact | 404（Home は宇宙の 3D のまま）
--variant  wide（PC 横長 1920x1200）| tall（スマホ縦長 900x1950）
--out      PNG の出力先（既定: .blender-out/）
--samples  Cycles のサンプル数
--preview  半分の解像度で構図を確かめる

書き出した PNG は `node scripts/blender/encode.mjs` で public/backgrounds/ の AVIF / WebP にする。
素材はすべてこのスクリプトと common.py が生成する（外部素材なし）。
"""

import argparse
import math
import os
import random
import sys

import bpy
from mathutils import Euler, Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as c  # noqa: E402
import worlds  # noqa: E402

SIZES = {"wide": (1920, 1200), "tall": (900, 1950)}


# ---------------------------------------------------------------- 探査船


def ship(origin, yaw, scale):
    """サイトの探査船（指令モジュール・居住リング・タンク・放熱板・3 基のノズル）。機首は -Y。"""
    hull = c.material(
        "hull", c.srgb(168, 174, 190), 0.36, 0.75, variation=(c.srgb(108, 112, 130), 2.6), bump=(7.0, 0.05)
    )
    dark = c.material("hull_dark", c.srgb(34, 37, 48), 0.45, 0.8, bump=(9.0, 0.08))
    gold = c.material("foil", c.srgb(206, 160, 78), 0.34, 1.0, bump=(11.0, 0.28))
    panel = c.material("radiator", c.srgb(26, 40, 66), 0.25, 0.7)
    window = c.glow_material("window", c.srgb(255, 214, 160), 5.0)
    cyan = c.glow_material("cyan", c.srgb(34, 211, 238), 5.0)
    magenta = c.glow_material("magenta", c.srgb(232, 121, 249), 5.0)

    parts = []

    def keep(obj):
        parts.append(obj)
        return obj

    # 指令モジュール
    keep(c.lathe("nose", [(0, -5.4), (0.34, -5.3), (0.72, -4.85), (0.9, -4.0), (0.9, -3.3), (0.62, -2.95), (0.42, -2.9)], hull))
    keep(c.lathe("nose_band", [(0.915, -3.85), (0.915, -3.62)], dark))
    for k in range(11):
        a = math.radians(20 + k * 14)
        keep(c.box("port", (0.1, 0.16, 0.07), window, Matrix.Translation((0.9 * math.cos(a), -4.1, 0.9 * math.sin(a))) @ Matrix.Rotation(-a, 4, "Y")))
    # 背骨
    keep(c.lathe("spine", [(0.42, -3.0), (0.42, 3.4)], dark, 24))
    for i in range(14):
        keep(c.lathe("rib", [(0.42, 0), (0.52, 0.03), (0.52, 0.09), (0.42, 0.12)], hull, 32, Matrix.Translation((0, -2.8 + i * 0.45, 0))))
    # 居住リングとスポーク
    ring_y = -1.45
    keep(c.torus("habitat", 2.45, 0.34, hull, Matrix.Translation((0, ring_y, 0))))
    keep(c.torus("habitat_trim", 2.45, 0.05, cyan, Matrix.Translation((0, ring_y - 0.345, 0))))
    for k in range(44):
        a = math.tau * k / 44
        keep(c.box("ring_window", (0.13, 0.06, 0.05), window, Matrix.Translation((2.79 * math.cos(a), ring_y, 2.79 * math.sin(a))) @ Matrix.Rotation(-a + math.pi / 2, 4, "Y")))
    for k in range(4):
        a = math.tau * k / 4 + math.pi / 4
        keep(c.beam("spoke", (0, ring_y, 0), (2.2 * math.cos(a), ring_y, 2.2 * math.sin(a)), 0.09, dark))
    # 金色のタンク
    for k in range(4):
        a = math.tau * k / 4
        pos = (0.88 * math.cos(a), 0.85, 0.88 * math.sin(a))
        keep(c.lathe("tank", [(0, -0.95), (0.3, -0.85), (0.43, -0.55), (0.43, 0.75), (0.3, 1.05), (0, 1.15)], gold, 40, Matrix.Translation(pos)))
    # 放熱板
    for side in (-1, 1):
        keep(c.beam("boom", (0, 2.1, 0), (side * 1.0, 2.1, 0), 0.06, dark))
        for i in range(6):
            keep(c.box("radiator", (0.36, 1.5, 0.035), panel, Matrix.Translation((side * (1.15 + i * 0.4), 2.1, 0)), 0.01))
        keep(c.box("radiator_edge", (2.4, 0.04, 0.05), magenta, Matrix.Translation((side * 2.15, 1.34, 0))))
    # 機関部と 3 基のノズル
    keep(c.lathe("engine_block", [(0.42, 3.0), (0.98, 3.3), (0.98, 4.1), (0.6, 4.35), (0, 4.35)], hull))
    for k in range(3):
        a = math.tau * k / 3 + math.pi / 2
        pos = (0.55 * math.cos(a), 4.2, 0.55 * math.sin(a))
        keep(c.lathe("nozzle", [(0.2, 0), (0.3, 0.35), (0.48, 0.95), (0.44, 0.95), (0.26, 0.35), (0.17, 0.05)], dark, 40, Matrix.Translation(pos)))
        keep(c.lathe("core", [(0, 0.2), (0.2, 0.22)], cyan, 32, Matrix.Translation(pos)))
    # アンテナと皿
    keep(c.beam("mast", (0, -2.45, 0.4), (0, -2.45, 1.55), 0.035, hull))
    keep(c.lathe("dish", [(0, 0), (0.28, 0.05), (0.5, 0.18)], hull, 40, Matrix.Translation((0, -2.45, 1.55)) @ Matrix.Rotation(math.radians(60), 4, "X")))

    transform = Matrix.Translation(origin) @ Matrix.Rotation(yaw, 4, "Z") @ Matrix.Scale(scale, 4)
    bpy.context.view_layer.update()
    for obj in parts:
        obj.matrix_world = transform @ obj.matrix_world
    return transform


# ---------------------------------------------------------------- 着陸台と格納庫


def landing_pad(center, radius, ground_z):
    cx, cy = center
    deck = c.material("deck", c.srgb(26, 22, 36), 0.34, 0.7, variation=(c.srgb(40, 34, 52), 0.5), bump=(3.0, 0.1))
    trim = c.material("deck_trim", c.srgb(70, 66, 86), 0.4, 0.8)
    seam = c.material("deck_seam", c.srgb(6, 5, 10), 0.6, 0.4)
    cyan = c.glow_material("pad_cyan", c.srgb(34, 211, 238), 3.2)
    magenta = c.glow_material("pad_magenta", c.srgb(232, 121, 249), 3.2)
    up = Matrix.Rotation(math.radians(90), 4, "X")  # 回転軸を +Z に向ける
    base = Matrix.Translation((cx, cy, ground_z))
    c.lathe("pad", [(0, 0.7), (radius - 0.25, 0.7), (radius, 0.45), (radius + 0.5, -0.8)], deck, 96, base @ up)
    top = Matrix.Translation((cx, cy, ground_z + 0.705))
    c.torus("pad_outer", radius - 0.55, 0.075, cyan, top @ up)
    c.torus("pad_inner", radius * 0.6, 0.06, magenta, top @ up)
    c.torus("pad_lip", radius - 0.2, 0.09, trim, top @ up)
    for r in (radius * 0.3, radius * 0.8):
        c.torus("pad_seam", r, 0.03, seam, top @ up)
    for k in range(16):
        a = math.tau * k / 16
        spin = Matrix.Rotation(a, 4, "Z")
        c.box("seam", (radius * 0.6, 0.05, 0.02), seam, top @ spin @ Matrix.Translation((radius * 0.58, 0, 0)))
    for k in range(24):
        a = math.tau * k / 24
        x, y = cx + (radius - 0.2) * math.cos(a), cy + (radius - 0.2) * math.sin(a)
        c.box("bollard", (0.16, 0.16, 0.34), trim, Matrix.Translation((x, y, ground_z + 0.86)), 0.03)
        c.box("lamp", (0.09, 0.09, 0.06), cyan if k % 2 else magenta, Matrix.Translation((x, y, ground_z + 1.07)))


def hangar(origin, yaw, ground):
    """奥へ続くアーチ状の格納庫。梁と外殻、内側の暖色の灯り。口は -Y。"""
    ox, oy = origin
    shell = c.material("shell", c.srgb(36, 30, 50), 0.55, 0.65, variation=(c.srgb(54, 44, 70), 0.35), bump=(2.5, 0.2))
    rib = c.material("shell_rib", c.srgb(82, 70, 102), 0.4, 0.8)
    lamp = c.glow_material("hangar_lamp", c.srgb(255, 188, 128), 7.0)
    cyan = c.glow_material("hangar_cyan", c.srgb(34, 211, 238), 2.6)
    base = Matrix.Translation((ox, oy, ground)) @ Matrix.Rotation(yaw, 4, "Z")
    width, height, depth = 7.0, 6.2, 18.0
    steps = 28

    def arch(i, grow=0.0):
        a = math.pi * i / steps
        return ((width + grow) * math.cos(a), (height + grow) * math.sin(a))

    verts, faces = [], []
    for y in (0.0, depth):
        for i in range(steps + 1):
            x, z = arch(i)
            verts.append((x, y, z))
    for i in range(steps):
        faces.append((i, i + 1, i + steps + 2, i + steps + 1))
    back = len(verts)
    for i in range(steps + 1):
        x, z = arch(i)
        verts.append((x, depth, z))
    faces.append(tuple(range(back, back + steps + 1)))
    c.mesh_object("shell", verts, faces, shell).matrix_world = base

    for k in range(7):
        y = k * depth / 6
        for i in range(steps):
            inset = 0.15 if k == 0 else -0.14
            (x0, z0), (x1, z1) = arch(i, inset), arch(i + 1, inset)
            obj = c.beam("rib", (x0, y, z0), (x1, y, z1), 0.17 if k == 0 else 0.11, rib, 8)
            bpy.context.view_layer.update()
            obj.matrix_world = base @ obj.matrix_world
        if k == 6:
            continue
        for i in (5, steps - 5):
            x, z = arch(i, -0.45)
            c.box("strip", (0.12, 1.3, 0.12), lamp, base @ Matrix.Translation((x, y + 1.2, z)))
            c.point(base @ Vector((x * 0.9, y + 1.2, z * 0.9)), c.srgb(255, 180, 120), 70.0, 0.3)
    # 床の誘導線と、奥の隔壁扉
    floor = c.material("hangar_floor", c.srgb(30, 25, 42), 0.3, 0.6, bump=(2.0, 0.08))
    c.box("floor", (width * 2, depth + 3.0, 0.3), floor, base @ Matrix.Translation((0, depth / 2 - 1.5, 0.0)))
    for x in (-2.6, 2.6):
        c.box("guide", (0.1, depth + 2.4, 0.04), cyan, base @ Matrix.Translation((x, depth / 2 - 1.5, 0.17)))
    c.box("door", (6.4, 0.3, 4.2), rib, base @ Matrix.Translation((0, depth - 0.2, 2.1)), 0.1)
    for k in range(1, 6):
        c.box("door_seam", (6.4, 0.06, 0.06), floor, base @ Matrix.Translation((0, depth - 0.37, k * 0.7)))
    c.box("door_light", (3.0, 0.08, 0.14), lamp, base @ Matrix.Translation((0, depth - 0.42, 4.55)))
    c.point(base @ Vector((0, depth - 3.0, 4.6)), c.srgb(255, 190, 140), 260.0, 0.6)
    for side in (-1, 1):
        c.box("door_line", (0.1, 0.1, 3.4), cyan, base @ Matrix.Translation((side * (width - 0.2), -0.2, 1.7)))


def antenna(x, y, ground_z, height, metal, beacon):
    c.beam("mast", (x, y, ground_z), (x, y, ground_z + height), height * 0.012, metal)
    for k in range(1, 6):
        z = ground_z + height * k / 6
        w = height * 0.07 * (1 - k / 7)
        c.beam("cross", (x - w, y, z), (x + w, y, z), height * 0.005, metal)
        c.beam("brace", (x - w, y, z), (x, y, ground_z + height * (k + 1) / 6), height * 0.004, metal)
    c.box("beacon", (height * 0.025,) * 3, beacon, Matrix.Translation((x, y, ground_z + height)))


# ---------------------------------------------------------------- 夜明けの遠景（Projects と作品詳細で共有）


HAZE = (112, 44, 118)


def dawn_backdrop(wide, planet=None):
    """朝焼けの空・山並み 2 列・環のある巨大惑星。planet=(中心, 半径) で惑星の位置を変える。"""
    haze = c.srgb(*HAZE)
    c.sky_world(
        [
            (0.0, c.srgb(190, 78, 150)),
            (0.05, c.srgb(118, 45, 125)),
            (0.13, c.srgb(54, 22, 80)),
            (0.27, c.srgb(20, 10, 40)),
            (0.6, c.srgb(6, 4, 14)),
        ],
        glow_dir=(0.34, 1.0, 0.02),
        glow_color=c.srgb(255, 160, 150),
        glow_power=14.0,
        nebula=c.srgb(30, 12, 52),
    )

    # 山並み 2 列。手前は暗く、奥は霞に溶ける
    def ridge(name, y0, depth, peak, scale, seed, color, near, far, haze_max, gap):
        def height(x, y):
            t = (y - y0) / depth
            envelope = math.sin(math.pi * min(1.0, max(0.0, t))) ** 0.8
            # 船のうしろは低くして、朝焼けを抜けさせる
            valley = 1.0 - gap * math.exp(-(((x - y0 * 0.16) / (y0 * 0.2)) ** 2))
            return c.ridged(x, y, scale, 9, seed) ** 1.35 * peak * envelope * valley - 1.0

        mat = c.material(
            name,
            color,
            0.9,
            haze=haze,
            haze_range=(near, far),
            haze_max=haze_max,
            variation=(c.srgb(20, 11, 30), 0.035),
        )
        c.terrain(name, (-y0 * 1.25, y0 * 1.25), (y0, y0 + depth), (760, 150), height, mat)

    ridge("ridge_near", 190.0, 130.0, 34.0 if wide else 44.0, 0.016, 4.2, c.srgb(58, 34, 66), 80.0, 620.0, 0.75, 0.7)
    ridge("ridge_far", 430.0, 220.0, 105.0 if wide else 130.0, 0.0072, 12.7, c.srgb(84, 50, 96), 150.0, 800.0, 0.86, 0.5)

    # 環のある巨大惑星
    if planet:
        planet_center, planet_radius = planet
    elif wide:
        planet_center, planet_radius = (390.0, 2000.0, 385.0), 190.0
    else:
        planet_center, planet_radius = (250.0, 2000.0, 900.0), 250.0
    c.ringed_planet(
        planet_center,
        planet_radius,
        light_dir=(0.8, -0.18, -0.42),
        sky_color=c.srgb(24, 11, 46),
        dark=c.srgb(16, 8, 32),
        lit=c.srgb(226, 150, 196),
        rim=c.srgb(255, 190, 214),
        ring=(1.35, 2.25, (math.radians(-9), math.radians(17), 0.0), c.srgb(196, 150, 214)),
        haze=0.16,
    )


# ---------------------------------------------------------------- Projects: 航路の工房


def scene_projects(variant):
    """夜明け前の惑星の発着場。左奥に格納庫、中央右の着陸台に探査船、空に環のある巨大惑星。"""
    wide = variant == "wide"
    haze = c.srgb(*HAZE)
    dawn_backdrop(wide)

    pad_x, pad_y, pad_r = (5.6, 30.0, 6.6) if wide else (0.0, 33.0, 6.6)

    hangar_x, hangar_y, hangar_yaw = (-17.5, 47.0, 28.0) if wide else (-13.0, 66.0, 22.0)
    inward = Vector((-math.sin(math.radians(hangar_yaw)), math.cos(math.radians(hangar_yaw))))

    def ground(x, y):
        base = c.fbm(x, y, 0.045, 5, 3.0) * 1.4 + c.fbm(x, y, 0.4, 4, 9.0) * 0.14
        # 着陸台のまわりは平らにする
        flat = min(1.0, max(0.0, (math.hypot(x - pad_x, y - pad_y) - pad_r - 1.0) / 7.0))
        for d in (0.0, 9.0, 18.0):
            near = math.hypot(x - hangar_x - inward.x * d, y - hangar_y - inward.y * d)
            flat = min(flat, max(0.0, (near - 8.0) / 6.0))
        return base * flat

    soil = c.material(
        "soil",
        c.srgb(46, 24, 52),
        0.85,
        haze=haze,
        haze_range=(45.0, 420.0),
        variation=(c.srgb(24, 13, 30), 0.09),
        bump=(1.4, 0.5),
    )
    c.terrain("ground", (-90, 90), (-5, 140), (540, 440), ground, soil, smooth=True)
    stone = c.material("stone", c.srgb(40, 26, 48), 0.8, haze=haze, haze_range=(45.0, 420.0), bump=(3.0, 0.4))
    c.rocks(
        11,
        900,
        ((-40, 40), (8, 90)),
        (0.06, 1.1),
        stone,
        ground,
        keep=lambda x, y: math.hypot(x - pad_x, y - pad_y) > pad_r + 1.5
        and all(math.hypot(x - hangar_x - inward.x * d, y - hangar_y - inward.y * d) > 8.5 for d in (-3.0, 6.0, 14.0)),
    )

    # 遠くの地面（霞の中へ）
    far_soil = c.material("far_soil", c.srgb(34, 18, 42), 0.9, haze=haze, haze_range=(45.0, 420.0))
    c.terrain("far_ground", (-900, 900), (139.5, 700), (240, 90), lambda x, y: c.fbm(x, y, 0.02, 4, 5.0) * 3.0, far_soil)

    # 着陸台・船・脚
    landing_pad((pad_x, pad_y), pad_r, 0.0)
    ship_z = 3.55
    transform = ship((pad_x, pad_y, ship_z), math.radians(-57 if wide else -50), 0.98)
    leg = c.material("leg", c.srgb(120, 122, 140), 0.35, 0.85)
    for sx, sy in ((-1, -2.6), (1, -2.6), (-1, 3.4), (1, 3.4)):
        top = transform @ Vector((sx * 0.35, sy, -0.3))
        foot = transform @ Vector((sx * 1.7, sy, -ship_z / 0.98 + 0.78))
        c.beam("leg", top, foot, 0.09, leg)
        c.lathe("foot", [(0, 0), (0.34, 0.02), (0.22, 0.16), (0, 0.18)], leg, 24, Matrix.Translation(foot) @ Matrix.Rotation(math.radians(90), 4, "X"))
    # 着陸台に落ちる灯り
    c.point((pad_x - 3.5, pad_y - 2.0, 1.6), c.srgb(34, 211, 238), 160.0, 0.8)
    c.point((pad_x + 3.8, pad_y + 1.0, 1.6), c.srgb(232, 121, 249), 200.0, 0.8)

    # 格納庫と通信塔
    hangar((hangar_x, hangar_y), math.radians(hangar_yaw), 0.0)
    # 着陸台へ導く誘導灯（手前から奥へ）
    taxi = c.glow_material("taxi", c.srgb(34, 211, 238), 4.0)
    for k in range(9):
        t = k / 9
        x = (-3.5 if wide else -3.0) + (pad_x - (-3.5 if wide else -3.0)) * t**1.6
        y = 13.0 + (pad_y - pad_r - 13.5) * t
        for side in (-1.7, 1.7):
            c.box("taxi", (0.12, 0.34, 0.07), taxi, Matrix.Translation((x + side, y, ground(x + side, y) + 0.1)))
    metal = c.material("mast_metal", c.srgb(46, 36, 60), 0.5, 0.7, haze=haze, haze_range=(45.0, 420.0))
    beacon = c.glow_material("beacon", c.srgb(255, 120, 170), 9.0)
    for x, y, h in ((19.0, 62.0, 13.0), (33.0, 98.0, 17.0), (-34.0, 105.0, 15.0)):
        antenna(x if wide else x * 0.55, y, 0.0, h, metal, beacon)
    # コンテナ（工房の資材）
    crate = c.material("crate", c.srgb(62, 46, 76), 0.55, 0.6, variation=(c.srgb(36, 28, 50), 1.5), bump=(5.0, 0.1))
    rng = random.Random(5)
    for x, y in ((-8.6, 38.0), (-10.6, 39.5), (-9.4, 41.2), (15.5, 43.0), (17.6, 44.2)):
        x = x if wide else x * 0.62
        size = (rng.uniform(1.4, 2.4), rng.uniform(1.0, 1.4), rng.uniform(0.8, 1.3))
        spin = Euler((0, 0, rng.uniform(-0.5, 0.5))).to_matrix().to_4x4()
        c.box("crate", size, crate, Matrix.Translation((x, y, size[2] / 2)) @ spin, 0.08)

    # 光: 奥の朝焼け（縁の光）+ 手前左の冷たい光
    c.sun((0.42, 0.86, 0.2), c.srgb(255, 150, 170), 2.6, 1.5)
    c.sun((-0.65, -0.55, 0.52), c.srgb(130, 160, 255), 0.75, 8.0)
    c.sun((0.7, -0.4, 0.35), c.srgb(236, 140, 220), 0.55, 8.0)


# ---------------------------------------------------------------- 作品詳細: 格納庫の中から


def scene_detail(variant):
    """格納庫の中から夜明けを望む。本文の左右の余白に梁と灯りが続く、静かな構図。"""
    wide = variant == "wide"
    haze = c.srgb(*HAZE)
    dawn_backdrop(wide, ((-250.0, 2000.0, 420.0), 150.0) if wide else ((120.0, 2000.0, 880.0), 190.0))

    soil = c.material("soil", c.srgb(42, 22, 50), 0.85, haze=haze, haze_range=(45.0, 420.0), bump=(1.4, 0.4))
    c.terrain("ground", (-130, 130), (48, 190.5), (400, 220), lambda x, y: c.fbm(x, y, 0.045, 5, 3.0) * 1.2 - 0.2, soil, True)
    far_soil = c.material("far_soil", c.srgb(34, 18, 42), 0.9, haze=haze, haze_range=(45.0, 420.0))
    c.terrain("far_ground", (-900, 900), (190, 700), (240, 80), lambda x, y: c.fbm(x, y, 0.02, 4, 5.0) * 3.0, far_soil)

    floor = c.material("deck", c.srgb(28, 24, 40), 0.28, 0.7, variation=(c.srgb(40, 34, 54), 0.4), bump=(2.5, 0.08))
    c.box("floor", (80.0, 56.0, 0.6), floor, Matrix.Translation((0, 22.0, -0.3)))
    seam = c.material("seam", c.srgb(6, 5, 10), 0.6, 0.4)
    for k in range(14):
        c.box("seam", (80.0, 0.06, 0.02), seam, Matrix.Translation((0, 6.0 + k * 3.2, 0.005)))
    cyan = c.glow_material("cyan", c.srgb(34, 211, 238), 2.6)
    magenta = c.glow_material("magenta", c.srgb(232, 121, 249), 2.6)
    lamp = c.glow_material("lamp", c.srgb(255, 188, 128), 6.0)
    for x in (-3.2, 3.2):
        for k in range(15):
            c.box("guide", (0.12, 1.3, 0.03), cyan, Matrix.Translation((x, 9.0 + k * 2.8, 0.02)))
    c.box("sill", (80.0, 0.14, 0.12), magenta, Matrix.Translation((0, 49.9, 0.06)))

    rib = c.material("rib", c.srgb(74, 62, 96), 0.4, 0.8, variation=(c.srgb(48, 40, 66), 0.8))
    wall = c.material("wall", c.srgb(24, 20, 36), 0.55, 0.65, bump=(2.0, 0.2))
    width, height, steps = (11.0 if wide else 7.0), (10.0 if wide else 13.0), 24

    def arch(i, grow=0.0):
        a = math.pi * i / steps
        # 角の丸い四角に近いアーチ
        x, z = math.cos(a), math.sin(a)
        return (
            (width + grow) * math.copysign(abs(x) ** 0.7, x),
            (height + grow) * abs(z) ** 0.7,
        )

    for y in (13.0, 19.0, 26.0, 34.0, 43.0, 50.0):
        for i in range(steps):
            (x0, z0), (x1, z1) = arch(i), arch(i + 1)
            c.beam("rib", (x0, y, z0), (x1, y, z1), 0.34, rib, 10)
        for side in (-1, 1):
            c.box("foot", (0.9, 1.1, 1.0), rib, Matrix.Translation((side * width, y, 0.5)), 0.12)
            c.box("lamp", (0.1, 0.12, 1.5), lamp, Matrix.Translation((side * (width - 0.42), y - 0.2, 2.9)))
            c.point((side * (width - 1.1), y - 0.7, 3.0), c.srgb(255, 176, 120), 90.0, 0.3)
    # 梁の間の外壁と、腰の高さの通路灯
    for i in range(steps):
        (x0, z0), (x1, z1) = arch(i, 0.45), arch(i + 1, 0.45)
        c.mesh_object("panel", [(x0, 4.0, z0), (x1, 4.0, z1), (x1, 50.0, z1), (x0, 50.0, z0)], [(0, 1, 2, 3)], wall)
    for side in (-1, 1):
        c.box("rail", (0.08, 37.0, 0.08), cyan, Matrix.Translation((side * (width - 0.1), 31.5, 1.35)))

    crate = c.material("crate", c.srgb(62, 46, 76), 0.55, 0.6, variation=(c.srgb(36, 28, 50), 1.5), bump=(5.0, 0.1))
    rng = random.Random(8)
    for x, y in ((-8.6, 24.0), (-9.4, 26.4), (8.8, 31.0), (9.2, 28.6), (-8.2, 39.0)):
        x *= width / 11.0
        size = (rng.uniform(1.2, 2.0), rng.uniform(1.0, 1.6), rng.uniform(0.8, 1.4))
        spin = Euler((0, 0, rng.uniform(-0.3, 0.3))).to_matrix().to_4x4()
        c.box("crate", size, crate, Matrix.Translation((x, y, size[2] / 2)) @ spin, 0.08)
    metal = c.material("mast_metal", c.srgb(46, 36, 60), 0.5, 0.7, haze=haze, haze_range=(45.0, 420.0))
    beacon = c.glow_material("beacon", c.srgb(255, 120, 170), 9.0)
    for x, y, h in ((14.0, 84.0, 12.0), (-21.0, 112.0, 16.0)):
        antenna(x if wide else x * 0.5, y, 0.0, h, metal, beacon)
    ship((13.0 if wide else 4.0, 96.0, 7.0), math.radians(-64), 0.9)

    c.sun((0.42, 0.86, 0.2), c.srgb(255, 150, 170), 2.2, 1.5)
    c.point((0.0, 8.0, 7.0), c.srgb(130, 150, 255), 420.0, 2.0)


DAWN_CAMERAS = {
    "wide": dict(location=(0, 0, 6.4), lens=32.0, shift_y=-0.047),
    "tall": dict(location=(0, 0, 7.2), lens=24.0, shift_y=-0.04),
}

SCENES = {
    # 画角: 地平を画面の中ほどより少し上に置き、見せたいものは本文の計器盤を避けて置く
    "projects": (scene_projects, DAWN_CAMERAS),
    "detail": (
        scene_detail,
        {
            "wide": dict(location=(0, 0, 5.0), lens=28.0, shift_y=-0.02),
            "tall": dict(location=(0, 0, 6.0), lens=24.0, shift_y=-0.02),
        },
    ),
    "about": (
        worlds.scene_about,
        {
            "wide": dict(location=(0, 0, 7.0), lens=32.0, shift_y=-0.047),
            "tall": dict(location=(0, 0, 8.0), lens=24.0, shift_y=-0.04),
        },
    ),
    "contact": (
        worlds.scene_contact,
        {
            "wide": dict(location=(0, 0, 7.5), lens=32.0, shift_y=-0.047),
            "tall": dict(location=(0, 0, 9.0), lens=24.0, shift_y=-0.04),
        },
    ),
    "404": (
        worlds.scene_404,
        {
            "wide": dict(location=(0, 0, 7.0), lens=32.0, shift_y=-0.047),
            "tall": dict(location=(0, 0, 8.5), lens=24.0, shift_y=-0.04),
        },
    ),
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--page", choices=sorted(SCENES), required=True)
    parser.add_argument("--variant", choices=sorted(SIZES), required=True)
    parser.add_argument("--out", default=".blender-out")
    parser.add_argument("--samples", type=int, default=192)
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])

    width, height = SIZES[args.variant]
    if args.preview:
        width, height = width // 2, height // 2
    scene = c.reset(width, height, args.samples)
    build, cameras = SCENES[args.page]
    c.camera(scene, **cameras[args.variant])
    build(args.variant)
    scene.render.filepath = os.path.abspath(os.path.join(args.out, f"{args.page}-{args.variant}.png"))
    bpy.ops.render.render(write_still=True)
    print("rendered", scene.render.filepath)


main()
