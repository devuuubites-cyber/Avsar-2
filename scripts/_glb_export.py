"""Shared glTF export helpers: Draco compression + optional decimation
to keep web assets in budget."""
import bpy

# Target ceiling per mesh after decimation. Photogrammetry meshes often
# arrive with millions of tris; web-friendly seabed dressing tops out
# around this. Adjust per-asset by passing max_tris.
DEFAULT_MAX_TRIS = 300_000


def total_tris():
    total = 0
    for o in bpy.context.scene.objects:
        if o.type != "MESH" or not o.data:
            continue
        total += sum(len(p.vertices) - 2 for p in o.data.polygons)
    return total


def decimate_if_over(max_tris=DEFAULT_MAX_TRIS):
    """Apply a Decimate modifier to each mesh so the scene fits the budget."""
    current = total_tris()
    if current <= max_tris:
        print(f"[decimate] scene at {current} tris, under {max_tris}; skipping")
        return
    ratio = max_tris / current
    print(f"[decimate] scene at {current} tris -> ratio {ratio:.4f}")
    for o in bpy.context.scene.objects:
        if o.type != "MESH":
            continue
        mod = o.modifiers.new(name="auto_decimate", type="DECIMATE")
        mod.ratio = ratio
        mod.use_collapse_triangulate = True
        try:
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except Exception as e:
            print(f"[decimate] apply failed for {o.name}: {e}")
    print(f"[decimate] scene at {total_tris()} tris after")


def export_glb(out_path, max_tris=DEFAULT_MAX_TRIS, draco_level=6):
    decimate_if_over(max_tris=max_tris)
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
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=draco_level,
    )
    print(f"[done] wrote {out_path}")
