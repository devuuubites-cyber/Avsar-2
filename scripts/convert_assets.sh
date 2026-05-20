#!/usr/bin/env bash
# Reproducible asset conversion: unzip sources, convert to .glb via bpy.
# Requires: /usr/bin/python3.11 with `bpy` installed (pip install bpy).
# Run from repo root: ./scripts/convert_assets.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/source"
OUT="$ROOT/public/models"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PY=/usr/bin/python3.11
mkdir -p "$OUT"
cd "$WORK"

echo "==> guppy (already .glb inside zip)"
mkdir guppy && cd guppy
unzip -q "$SRC/bi-coloured-guppy-male.zip"
cp source/model.glb "$OUT/guppy.glb"
cd ..

echo "==> koi (.blend -> .glb)"
mkdir koi && cd koi
unzip -q "$SRC/koi-fish.zip"
"$PY" "$ROOT/scripts/blend_to_glb.py" -- source/koifish.blend "$OUT/koi.glb"
cd ..

echo "==> jellyfish (.obj -> .glb)"
mkdir jellyfish && cd jellyfish
unzip -q "$SRC/jellyfish.zip"
"$PY" "$ROOT/scripts/obj_to_glb.py" -- source/meduselopoly.obj "$OUT/jellyfish.glb"
cd ..

echo "==> ocean floor (.usdz -> .usdc -> .glb)"
mkdir ocean && cd ocean
unzip -q "$SRC/Ocean_Floor_Scene.usdz"
"$PY" "$ROOT/scripts/usd_to_glb.py" -- scene.usdc "$OUT/ocean_floor.glb"
cd ..

echo "==> verify"
for f in guppy.glb koi.glb jellyfish.glb ocean_floor.glb; do
  if [ ! -f "$OUT/$f" ]; then
    echo "MISSING: $f"; exit 1
  fi
  magic="$(head -c 4 "$OUT/$f")"
  if [ "$magic" != "glTF" ]; then
    echo "BAD MAGIC for $f: $magic"; exit 1
  fi
  size="$(du -h "$OUT/$f" | cut -f1)"
  echo "  OK $f ($size)"
done

echo "==> done"
