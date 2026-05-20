"""Headless Blender: import a .usdc (extracted from .usdz), export GLB.

Usage:
    blender --background --python scripts/usd_to_glb.py -- in.usdc out.glb
"""
import sys
import os
import bpy

argv = sys.argv
if "--" not in argv:
    raise SystemExit("missing -- separator")
extra = argv[argv.index("--") + 1:]
if len(extra) < 2:
    raise SystemExit("usage: -- in.usdc out.glb")
usd_path = os.path.abspath(extra[0])
out_path = os.path.abspath(extra[1])

bpy.ops.wm.read_factory_settings(use_empty=True)

try:
    bpy.ops.wm.usd_import(filepath=usd_path)
except Exception as e:
    raise SystemExit(f"USD import failed: {e}")

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
