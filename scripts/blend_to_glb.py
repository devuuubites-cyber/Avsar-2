"""Open a .blend, remap missing image paths, export as GLB.

Usage:
    python3.11 scripts/blend_to_glb.py -- in.blend out.glb
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from _glb_export import export_glb

argv = sys.argv
if "--" not in argv:
    raise SystemExit("missing -- separator")
extra = argv[argv.index("--") + 1:]
if len(extra) < 2:
    raise SystemExit("usage: -- in.blend out.glb")
blend_path = os.path.abspath(extra[0])
out_path = os.path.abspath(extra[1])

bpy.ops.wm.open_mainfile(filepath=blend_path)

blend_dir = os.path.dirname(blend_path)
candidate_tex_dirs = [
    os.path.join(blend_dir, "..", "textures"),
    os.path.join(blend_dir, "textures"),
    blend_dir,
]

for img in bpy.data.images:
    if img.source != "FILE":
        continue
    abs_now = bpy.path.abspath(img.filepath) if img.filepath else ""
    if abs_now and os.path.isfile(abs_now):
        continue
    basename = os.path.basename(img.filepath) or img.name
    for d in candidate_tex_dirs:
        cand = os.path.join(d, basename)
        if os.path.isfile(cand):
            img.filepath = cand
            try:
                img.reload()
            except Exception:
                pass
            print(f"[remap] {img.name} -> {cand}")
            break

export_glb(out_path)
