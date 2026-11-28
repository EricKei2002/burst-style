"""背景レンダリングの共通部品（Blender 5.x / Cycles）。

素材はすべてこのスクリプトで生成する（外部の画像・モデル・HDRI は使わない）。
座標は Z が上、カメラは +Y を水平に見る。乱数はシード固定なので同じ画像を再生成できる。
"""

import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector, noise


def srgb(r, g, b):
    """画面で見たい 0-255 の色を、シェーダー用のリニア値にする。"""

    def lin(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (lin(r), lin(g), lin(b), 1.0)


# ---------------------------------------------------------------- シーン設定


def reset(width, height, samples):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for device in prefs.devices:
            device.use = True
        scene.cycles.device = "GPU"
    except TypeError:
        scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.seed = 7
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 6
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "8"
    # 色は指定どおりに出す（AgX はフクシアとシアンが濁る）
    scene.view_settings.view_transform = "Standard"
    scene.render.dither_intensity = 1.0
    return scene


def camera(scene, location, lens, shift_x=0.0, shift_y=0.0):
    data = bpy.data.cameras.new("cam")
    data.lens = lens
    data.sensor_width = 36.0
    data.sensor_height = 36.0
    data.sensor_fit = "AUTO"  # 長辺に 36mm を当てる
    data.shift_x = shift_x
    data.shift_y = shift_y
    data.clip_end = 20000
    obj = bpy.data.objects.new("cam", data)
    obj.location = location
    obj.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(obj)
    scene.camera = obj
    return obj


def sun(direction, color, energy, angle=0.5):
    data = bpy.data.lights.new("sun", "SUN")
    data.color = color[:3]
    data.energy = energy
    data.angle = math.radians(angle)
    obj = bpy.data.objects.new("sun", data)
    # direction は「光が来る向き」
    obj.rotation_euler = Vector(direction).normalized().to_track_quat("Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(obj)
    return obj


def point(location, color, energy, radius=0.2):
    data = bpy.data.lights.new("point", "POINT")
    data.color = color[:3]
    data.energy = energy
    data.shadow_soft_size = radius
    obj = bpy.data.objects.new("point", data)
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------- ノード


class Nodes:
    """ノードツリーを短く組むための薄い包み。"""

    def __init__(self, tree):
        self.tree = tree
        tree.nodes.clear()

    def add(self, kind, **props):
        node = self.tree.nodes.new(kind)
        for key, value in props.items():
            setattr(node, key, value)
        return node

    def link(self, out, socket):
        self.tree.links.new(out, socket)

    def value(self, socket, v):
        if isinstance(v, bpy.types.NodeSocket):
            self.link(v, socket)
        else:
            socket.default_value = v

    def math(self, op, a, b=0.0, clamp=False):
        node = self.add("ShaderNodeMath", operation=op, use_clamp=clamp)
        self.value(node.inputs[0], a)
        self.value(node.inputs[1], b)
        return node.outputs[0]

    def vmath(self, op, a, b=None):
        node = self.add("ShaderNodeVectorMath", operation=op)
        self.value(node.inputs[0], a)
        if b is not None:
            self.value(node.inputs[1], b)
        if op in {"DOT_PRODUCT", "LENGTH", "DISTANCE"}:
            return node.outputs["Value"]
        return node.outputs[0]

    def scale(self, vector, factor):
        node = self.add("ShaderNodeVectorMath", operation="SCALE")
        self.value(node.inputs[0], vector)
        self.value(node.inputs["Scale"], factor)
        return node.outputs[0]

    def mix(self, factor, a, b, blend="MIX"):
        node = self.add("ShaderNodeMix", data_type="RGBA", blend_type=blend)
        self.value(node.inputs[0], factor)
        self.value(node.inputs[6], a)
        self.value(node.inputs[7], b)
        return node.outputs[2]

    def ramp(self, factor, stops, interpolation="LINEAR"):
        node = self.add("ShaderNodeValToRGB")
        ramp = node.color_ramp
        ramp.interpolation = interpolation
        while len(ramp.elements) > 1:
            ramp.elements.remove(ramp.elements[-1])
        ramp.elements[0].position = stops[0][0]
        ramp.elements[0].color = stops[0][1]
        for position, color in stops[1:]:
            element = ramp.elements.new(position)
            element.color = color
        self.value(node.inputs[0], factor)
        return node.outputs[0]

    def noise(self, vector, scale, detail=6.0, roughness=0.55):
        node = self.add("ShaderNodeTexNoise")
        if vector is not None:
            self.link(vector, node.inputs["Vector"])
        node.inputs["Scale"].default_value = scale
        node.inputs["Detail"].default_value = detail
        node.inputs["Roughness"].default_value = roughness
        return node.outputs["Fac"]


# ---------------------------------------------------------------- 空


def sky_world(stops, glow_dir, glow_color, glow_power, nebula=None, stars=1.0):
    """高さで変わる空 + 地平の光 + 星 + 薄い星雲。stops は (高さ 0..1, 色)。"""
    world = bpy.data.worlds.new("sky")
    bpy.context.scene.world = world
    n = Nodes(world.node_tree)
    coord = n.add("ShaderNodeTexCoord").outputs["Generated"]
    direction = n.vmath("NORMALIZE", coord)
    xyz = n.add("ShaderNodeSeparateXYZ")
    n.link(direction, xyz.inputs[0])
    height = n.math("MAXIMUM", xyz.outputs["Z"], 0.0)
    color = n.ramp(height, stops, "EASE")

    # 地平線の近くだけに広がる光
    facing = n.math("MAXIMUM", n.vmath("DOT_PRODUCT", direction, Vector(glow_dir).normalized()), 0.0)
    glow = n.math("POWER", facing, glow_power)
    low = n.math("POWER", n.math("SUBTRACT", 1.0, height, True), 7.0)
    color = n.mix(n.math("MULTIPLY", glow, low, True), color, glow_color)

    if nebula:
        cloud = n.noise(n.vmath("MULTIPLY", direction, Vector((1.0, 1.0, 3.2))), 2.2, 9.0, 0.62)
        mask = n.ramp(cloud, [(0.46, (0, 0, 0, 1)), (0.8, (1, 1, 1, 1))])
        lift = n.math("MULTIPLY", n.math("SUBTRACT", height, 0.04, True), 5.0, True)
        color = n.mix(n.math("MULTIPLY", mask, lift, True), color, nebula, "ADD")

    # 星: ボロノイの核だけを残し、明るさを 1 粒ごとに変える
    for scale, size, strength in ((260.0, 0.09, 0.8), (90.0, 0.045, 2.4)):
        vor = n.add("ShaderNodeTexVoronoi")
        n.link(direction, vor.inputs["Vector"])
        vor.inputs["Scale"].default_value = scale
        core = n.math("LESS_THAN", vor.outputs["Distance"], size)
        pick = n.add("ShaderNodeSeparateColor")
        n.link(vor.outputs["Color"], pick.inputs[0])
        bright = n.math("POWER", pick.outputs[0], 6.0)
        fade = n.math("MULTIPLY", n.math("SUBTRACT", height, 0.05, True), 4.0, True)
        star = n.math("MULTIPLY", n.math("MULTIPLY", core, bright), n.math("MULTIPLY", fade, strength * stars))
        color = n.vmath("ADD", color, n.scale((0.85, 0.88, 1.0), star))

    background = n.add("ShaderNodeBackground")
    n.link(color, background.inputs["Color"])
    out = n.add("ShaderNodeOutputWorld")
    n.link(background.outputs[0], out.inputs["Surface"])


# ---------------------------------------------------------------- 材質


def material(
    name,
    color,
    roughness=0.6,
    metallic=0.0,
    haze=None,
    haze_range=(60.0, 900.0),
    haze_max=0.9,
    variation=None,
    bump=None,
    emission=None,
):
    """PBR 材質。haze を渡すと、遠いほど空の色に溶ける（空気遠近）。

    variation=(色2, 大きさ) で色むら、bump=(大きさ, 強さ) で細かい凹凸、emission=(色, 強さ)。
    """
    mat = bpy.data.materials.new(name)
    n = Nodes(mat.node_tree)
    bsdf = n.add("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    position = n.add("ShaderNodeNewGeometry").outputs["Position"]
    if variation:
        other, scale = variation
        mask = n.ramp(n.noise(position, scale, 7.0), [(0.4, (0, 0, 0, 1)), (0.62, (1, 1, 1, 1))])
        n.link(n.mix(mask, color, other), bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = color
    if bump:
        scale, strength = bump
        node = n.add("ShaderNodeBump")
        node.inputs["Strength"].default_value = strength
        node.inputs["Distance"].default_value = 0.5
        n.link(n.noise(position, scale, 8.0, 0.65), node.inputs["Height"])
        n.link(node.outputs[0], bsdf.inputs["Normal"])
    if emission:
        glow, strength = emission
        bsdf.inputs["Emission Color"].default_value = glow
        bsdf.inputs["Emission Strength"].default_value = strength
    surface = bsdf.outputs[0]
    if haze:
        distance = n.add("ShaderNodeCameraData").outputs["View Distance"]
        near, far = haze_range
        factor = n.math("DIVIDE", n.math("SUBTRACT", distance, near), far - near, True)
        factor = n.math("MULTIPLY", n.math("POWER", factor, 0.8), haze_max)
        fog = n.add("ShaderNodeEmission")
        fog.inputs["Color"].default_value = haze
        blend = n.add("ShaderNodeMixShader")
        n.link(factor, blend.inputs[0])
        n.link(surface, blend.inputs[1])
        n.link(fog.outputs[0], blend.inputs[2])
        surface = blend.outputs[0]
    out = n.add("ShaderNodeOutputMaterial")
    n.link(surface, out.inputs["Surface"])
    return mat


def glow_material(name, color, strength):
    mat = bpy.data.materials.new(name)
    n = Nodes(mat.node_tree)
    emission = n.add("ShaderNodeEmission")
    emission.inputs["Color"].default_value = color
    emission.inputs["Strength"].default_value = strength
    out = n.add("ShaderNodeOutputMaterial")
    n.link(emission.outputs[0], out.inputs["Surface"])
    return mat


# ---------------------------------------------------------------- 形


def mesh_object(name, verts, faces, mat, smooth=False):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    if smooth:
        mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def lathe(name, profile, mat, segments=64, matrix=None):
    """(半径, 軸位置) の並びを +Y 軸まわりに回した回転体。"""
    verts, faces = [], []
    for radius, along in profile:
        for s in range(segments):
            a = math.tau * s / segments
            verts.append((radius * math.cos(a), along, radius * math.sin(a)))
    for i in range(len(profile) - 1):
        for s in range(segments):
            a, b = i * segments + s, i * segments + (s + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    obj = mesh_object(name, verts, faces, mat, smooth=True)
    obj.data.set_sharp_from_angle(angle=math.radians(35))
    if matrix:
        obj.matrix_world = matrix
    return obj


def box(name, size, mat, matrix, bevel=0.0):
    x, y, z = (s / 2 for s in size)
    verts = [(sx * x, sy * y, sz * z) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    obj = mesh_object(name, verts, faces, mat)
    obj.matrix_world = matrix
    if bevel:
        mod = obj.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    return obj


def beam(name, start, end, radius, mat, segments=10):
    start, end = Vector(start), Vector(end)
    axis = end - start
    rotation = Vector((0, 1, 0)).rotation_difference(axis.normalized()).to_matrix().to_4x4()
    profile = [(0.0, 0.0), (radius, 0.0), (radius, axis.length), (0.0, axis.length)]
    return lathe(name, profile, mat, segments, Matrix.Translation(start) @ rotation)


def torus(name, major, minor, mat, matrix, major_seg=160, minor_seg=14):
    """+Y 軸を中心にした輪。"""
    verts, faces = [], []
    for i in range(major_seg):
        a = math.tau * i / major_seg
        for j in range(minor_seg):
            b = math.tau * j / minor_seg
            r = major + minor * math.cos(b)
            verts.append((r * math.cos(a), minor * math.sin(b), r * math.sin(a)))
    for i in range(major_seg):
        for j in range(minor_seg):
            i2, j2 = (i + 1) % major_seg, (j + 1) % minor_seg
            faces.append((i * minor_seg + j, i2 * minor_seg + j, i2 * minor_seg + j2, i * minor_seg + j2))
    obj = mesh_object(name, verts, faces, mat, smooth=True)
    obj.matrix_world = matrix
    return obj


def terrain(name, x_range, y_range, resolution, height, mat, smooth=False):
    """height(x, y) で持ち上げた地面。"""
    nx, ny = resolution
    verts, faces = [], []
    for j in range(ny + 1):
        y = y_range[0] + (y_range[1] - y_range[0]) * j / ny
        for i in range(nx + 1):
            x = x_range[0] + (x_range[1] - x_range[0]) * i / nx
            verts.append((x, y, height(x, y)))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    return mesh_object(name, verts, faces, mat, smooth)


def ridged(x, y, scale, octaves=8, seed=0.0):
    """尾根のある山のノイズ（おおよそ 0..1）。"""
    p = Vector((x * scale + seed, y * scale - seed, seed * 0.37))
    value = noise.ridged_multi_fractal(p, 0.9, 2.1, octaves, 1.0, 2.0, noise_basis="PERLIN_ORIGINAL")
    return value / 2.2


def fbm(x, y, scale, octaves=5, seed=0.0):
    return noise.fractal(Vector((x * scale + seed, y * scale + seed, seed)), 1.0, 2.0, octaves)


def rocks(seed, count, area, size, mat, ground, keep=lambda x, y: True):
    """歪めた球を数種類作り、使い回して地面に撒く。"""
    rng = random.Random(seed)
    meshes = []
    for k in range(6):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
        for v in bm.verts:
            d = noise.fractal(v.co * 1.4 + Vector((k * 7.3, 0, 0)), 1.0, 2.0, 4)
            v.co *= 1.0 + d * 0.55
            v.co.z *= 0.62
        mesh = bpy.data.meshes.new(f"rock{k}")
        bm.to_mesh(mesh)
        bm.free()
        mesh.materials.append(mat)
        meshes.append(mesh)
    placed = 0
    while placed < count:
        x = rng.uniform(*area[0])
        y = rng.uniform(*area[1])
        if not keep(x, y):
            continue
        placed += 1
        s = size[0] + (size[1] - size[0]) * rng.random() ** 4
        obj = bpy.data.objects.new("rock", meshes[rng.randrange(len(meshes))])
        obj.location = (x, y, ground(x, y) + s * 0.1)
        obj.scale = (s, s * rng.uniform(0.7, 1.3), s * rng.uniform(0.6, 1.1))
        obj.rotation_euler = (rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2), rng.uniform(0, math.tau))
        bpy.context.scene.collection.objects.link(obj)


def ringed_planet(center, radius, light_dir, sky_color, dark, lit, rim, ring=None, haze=0.2):
    """空に浮かぶ惑星。照明は材質の中で計算し、空の色を少し足して遠さを出す。"""
    mat = bpy.data.materials.new("planet")
    n = Nodes(mat.node_tree)
    geometry = n.add("ShaderNodeNewGeometry")
    normal = geometry.outputs["Normal"]
    facing = n.vmath("DOT_PRODUCT", normal, Vector(light_dir).normalized())
    day = n.math("POWER", n.math("ADD", facing, 0.12, True), 1.1)
    offset = n.vmath("SUBTRACT", geometry.outputs["Position"], Vector(center))
    local = n.vmath("MULTIPLY", offset, Vector((1 / radius, 1 / radius, 6.0 / radius)))
    bands = n.noise(local, 1.15, 8.0, 0.6)

    def shade(k):
        return tuple(c * k for c in lit[:3]) + (1.0,)

    surface = n.ramp(bands, [(0.36, shade(0.4)), (0.48, shade(1.0)), (0.55, shade(0.62)), (0.66, shade(0.9))])
    color = n.mix(day, dark, surface)
    view = n.math("ABSOLUTE", n.vmath("DOT_PRODUCT", normal, geometry.outputs["Incoming"]))
    edge = n.math("POWER", n.math("SUBTRACT", 1.0, view, True), 3.5)
    color = n.mix(n.math("MULTIPLY", edge, n.math("ADD", day, 0.12, True)), color, rim)
    color = n.mix(haze, color, sky_color)
    emission = n.add("ShaderNodeEmission")
    n.link(color, emission.inputs["Color"])
    out = n.add("ShaderNodeOutputMaterial")
    n.link(emission.outputs[0], out.inputs["Surface"])

    profile = [
        (radius * math.sin(math.pi * i / 96), -radius * math.cos(math.pi * i / 96)) for i in range(97)
    ]
    body = lathe("planet", profile, mat, 192, Matrix.Translation(center))
    body.visible_shadow = False

    if not ring:
        return
    inner, outer, tilt, ring_color = ring
    ring_mat = bpy.data.materials.new("ring")
    n = Nodes(ring_mat.node_tree)
    uv = n.add("ShaderNodeTexCoord").outputs["Object"]
    length = n.vmath("LENGTH", uv)
    t = n.math("DIVIDE", n.math("SUBTRACT", length, radius * inner), radius * (outer - inner), True)
    combine = n.add("ShaderNodeCombineXYZ")
    n.link(t, combine.inputs["X"])
    stripes = n.noise(combine.outputs[0], 11.0, 5.0, 0.7)
    alpha = n.ramp(stripes, [(0.4, (0, 0, 0, 1)), (0.68, (0.8, 0.8, 0.8, 1))])
    fade = n.math("MULTIPLY", n.math("MULTIPLY", t, n.math("SUBTRACT", 1.0, t)), 4.0, True)
    alpha = n.math("MULTIPLY", alpha, fade)
    emission = n.add("ShaderNodeEmission")
    emission.inputs["Color"].default_value = ring_color
    clear = n.add("ShaderNodeBsdfTransparent")
    blend = n.add("ShaderNodeMixShader")
    n.link(alpha, blend.inputs[0])
    n.link(clear.outputs[0], blend.inputs[1])
    n.link(emission.outputs[0], blend.inputs[2])
    out = n.add("ShaderNodeOutputMaterial")
    n.link(blend.outputs[0], out.inputs["Surface"])
    verts, faces = [], []
    segments = 256
    for r in (radius * inner, radius * outer):
        for s in range(segments):
            a = math.tau * s / segments
            verts.append((r * math.cos(a), r * math.sin(a), 0.0))
    for s in range(segments):
        faces.append((s, (s + 1) % segments, segments + (s + 1) % segments, segments + s))
    obj = mesh_object("ring", verts, faces, ring_mat)
    obj.location = center
    obj.rotation_euler = tilt
    obj.visible_shadow = False
