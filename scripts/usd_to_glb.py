"""Headless Blender: import a .usdc (extracted from .usdz), export GLB.

Usage:
    blender --background --python scripts/usd_to_glb.py -- in.usdc out.glb
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
    raise SystemExit("usage: -- in.usdc out.glb")
usd_path = os.path.abspath(extra[0])
out_path = os.path.abspath(extra[1])

bpy.ops.wm.read_factory_settings(use_empty=True)

try:
    bpy.ops.wm.usd_import(filepath=usd_path)
except Exception as e:
    raise SystemExit(f"USD import failed: {e}")

export_glb(out_path)
