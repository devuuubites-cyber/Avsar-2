"""Headless Blender: import an OBJ with sibling PBR PNGs, build a
Principled BSDF material, export GLB.

Usage:
    blender --background --python scripts/obj_to_glb.py -- in.obj out.glb
"""
import sys
import os
import glob
import bpy

argv = sys.argv
if "--" not in argv:
    raise SystemExit("missing -- separator")
extra = argv[argv.index("--") + 1:]
if len(extra) < 2:
    raise SystemExit("usage: -- in.obj out.glb")
obj_path = os.path.abspath(extra[0])
out_path = os.path.abspath(extra[1])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=obj_path)

obj_dir = os.path.dirname(obj_path)
texture_dir = os.path.join(os.path.dirname(obj_dir), "textures")
if not os.path.isdir(texture_dir):
    texture_dir = obj_dir

def find_tex(*keywords):
    for f in glob.glob(os.path.join(texture_dir, "*")):
        name = os.path.basename(f).lower()
        if all(k.lower() in name for k in keywords):
            return f
    return None

base_color = find_tex("basecolor") or find_tex("base", "color") or find_tex("diffuse")
normal     = find_tex("normal")
roughness  = find_tex("roughness")
emissive   = find_tex("emissive") or find_tex("emission")

print(f"[tex] base_color={base_color}")
print(f"[tex] normal={normal}")
print(f"[tex] roughness={roughness}")
print(f"[tex] emissive={emissive}")

mat = bpy.data.materials.new(name="JellyfishMaterial")
mat.use_nodes = True
nt = mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)

bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (200, 0)
out = nt.nodes.new("ShaderNodeOutputMaterial")
out.location = (500, 0)
nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

def add_image(path, colorspace, x, y):
    img = bpy.data.images.load(path, check_existing=True)
    img.colorspace_settings.name = colorspace
    node = nt.nodes.new("ShaderNodeTexImage")
    node.image = img
    node.location = (x, y)
    return node

if base_color:
    n = add_image(base_color, "sRGB", -400, 200)
    nt.links.new(n.outputs["Color"], bsdf.inputs["Base Color"])
if roughness:
    n = add_image(roughness, "Non-Color", -400, 0)
    nt.links.new(n.outputs["Color"], bsdf.inputs["Roughness"])
if normal:
    n = add_image(normal, "Non-Color", -600, -200)
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.location = (-300, -200)
    nt.links.new(n.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
if emissive:
    n = add_image(emissive, "sRGB", -400, -400)
    nt.links.new(n.outputs["Color"], bsdf.inputs["Emission Color"])
    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = 1.5

bsdf.inputs["Alpha"].default_value = 0.85
mat.blend_method = "BLEND"

for o in bpy.context.scene.objects:
    if o.type == "MESH":
        o.data.materials.clear()
        o.data.materials.append(mat)

try:
    bpy.ops.file.pack_all()
except Exception as e:
    print(f"[pack_all] warning: {e}")

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_image_format="AUTO",
)
print(f"[done] wrote {out_path}")
