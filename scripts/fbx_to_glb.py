"""Import an FBX with sibling JPG textures, ensure materials are bound,
export as GLB.

Usage:
    python3.11 scripts/fbx_to_glb.py -- in.fbx out.glb [texture_dir]
"""
import sys
import os
import glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _glb_export import export_glb

argv = sys.argv
if "--" not in argv:
    raise SystemExit("missing -- separator")
extra = argv[argv.index("--") + 1:]
if len(extra) < 2:
    raise SystemExit("usage: -- in.fbx out.glb [tex_dir]")
fbx_path = os.path.abspath(extra[0])
out_path = os.path.abspath(extra[1])
tex_dir = os.path.abspath(extra[2]) if len(extra) >= 3 else os.path.dirname(fbx_path)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=fbx_path)

# Photogrammetry FBX often loses texture refs on re-export; resolve by
# looking for sibling JPGs.
candidate_dirs = [
    tex_dir,
    os.path.join(os.path.dirname(fbx_path), "..", "textures"),
    os.path.join(os.path.dirname(fbx_path), "textures"),
    os.path.dirname(fbx_path),
]

def find_tex(*keywords, exts=("jpg", "jpeg", "png")):
    for d in candidate_dirs:
        if not os.path.isdir(d):
            continue
        for ext in exts:
            for f in sorted(glob.glob(os.path.join(d, f"*.{ext}"))):
                name = os.path.basename(f).lower()
                if all(k.lower() in name for k in keywords):
                    return f
    return None

# Try to repair any missing image refs first.
for img in bpy.data.images:
    if img.source != "FILE":
        continue
    abs_now = bpy.path.abspath(img.filepath) if img.filepath else ""
    if abs_now and os.path.isfile(abs_now):
        continue
    basename = os.path.basename(img.filepath) if img.filepath else ""
    located = None
    for d in candidate_dirs:
        cand = os.path.join(d, basename) if basename else ""
        if cand and os.path.isfile(cand):
            located = cand
            break
    if not located:
        located = find_tex("model")
    if located:
        img.filepath = located
        try:
            img.reload()
        except Exception:
            pass
        print(f"[remap] {img.name} -> {located}")

# If no meshes ended up with image textures, build a basic material
# from the sibling diffuse jpg so the GLB ships colored.
def mesh_has_image_tex(o):
    if not (o.type == "MESH" and o.data.materials):
        return False
    for m in o.data.materials:
        if not (m and m.use_nodes):
            continue
        for n in m.node_tree.nodes:
            if n.type == "TEX_IMAGE" and n.image:
                return True
    return False

needs_material = not any(mesh_has_image_tex(o) for o in bpy.data.objects)
if needs_material:
    diffuse = find_tex("model")
    print(f"[material-rebuild] needed; diffuse={diffuse}")
    if diffuse:
        mat = bpy.data.materials.new(name="TerrainMaterial")
        mat.use_nodes = True
        nt = mat.node_tree
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        bsdf.location = (200, 0)
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        out.location = (500, 0)
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
        img = bpy.data.images.load(diffuse, check_existing=True)
        img.colorspace_settings.name = "sRGB"
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = img
        tex.location = (-300, 200)
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        for o in bpy.context.scene.objects:
            if o.type == "MESH":
                o.data.materials.clear()
                o.data.materials.append(mat)

export_glb(out_path)
