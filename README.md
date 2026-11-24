# roblox-part-to-mesh

A Roblox Studio plugin that bakes a build of block Parts into one textured MeshPart, with the faces nobody can see removed.

<picture>
  <source media="(max-width: 600px)" srcset="docs/hero-phone.png">
  <img src="docs/hero.png" width="100%" alt="An example house of 144 one-stud Parts, pulled apart, turns into a single outlined mesh with the same shape, colours and studs.">
</picture>

## Install

1. **Start the backend** and paste your Open Cloud API key into the window that opens:

   ```powershell
   pip install -r backend/requirements.txt
   python backend/app.py
   ```

   Create the key at [create.roblox.com/dashboard/credentials](https://create.roblox.com/dashboard/credentials) with the **Assets** API (read and write) for the user or group that should own the meshes.

2. **Install the plugin.** Copy `plugin/PartToMesh.rbxmx` into your plugins folder (in Studio: **Plugins → Plugins Folder**) and restart Studio. Turn on **Game Settings → Security → Allow HTTP Requests**.

3. **Run it.** Click **Part To Mesh** in the toolbar, enter your creator type and ID once, select a model and click **Optimize Selected Model**. The mesh arrives as `<name>_Optimized` beside your original, which stays untouched.

Prefer a standalone app? `backend/build_exe.ps1` builds `backend/dist/Part To Mesh Backend.exe`.

## What it does

<picture>
  <source media="(max-width: 600px)" srcset="docs/steps-phone.png">
  <img src="docs/steps.png" width="100%" alt="Three steps: faces where two parts touch are dropped; a 4 by 3 slab of parts becomes one flat face; studs on top become a texture instead of geometry.">
</picture>

The finished `.glb` is uploaded through Open Cloud as a `Model` asset owned by your user or group, and the plugin inserts it into your place.

<picture>
  <source media="(max-width: 600px)" srcset="docs/xray-phone.png">
  <img src="docs/xray.png" width="100%" alt="The same example house as an x-ray: hundreds of internal faces between touching parts are filled red; next to it, the finished mesh.">
</picture>

The counts in these pictures are computed from the example house they show; they are not a benchmark. Your savings depend on how solid your build is: thick walls and floors lose the most.

> [!IMPORTANT]
> Only `Part` instances with `Shape = Block` are converted. Wedges, cylinders, spheres, unions, MeshParts and CSG are not supported yet.

## How it works

**Studio plugin** → **backend on `127.0.0.1`** → `.glb` → **Open Cloud** → **back into Studio**

The plugin sends your Parts to a backend on your own machine. The backend builds and uploads the mesh, and your Open Cloud key never leaves it. There are two backends:

| | Desktop app | Pipeline server |
|---|---|---|
| Start | `python backend/app.py` | `python backend/server.py` |
| Plugin URL | `http://127.0.0.1:8790` (default) | `http://127.0.0.1:8788` |
| API key | Setup window | `ROBLOX_OPEN_CLOUD_API_KEY` |
| Hidden faces | Removed in Python | Removed in Blender (HiddenGeometryRemoval) |
| Needs | Python 3.10+ | Python, Blender, `gltfpack` |

## Plugin settings

| Field | What to put there |
|---|---|
| Backend URL | The plugin URL from the table above |
| Creator type | `user` or `group` |
| Creator ID | The user or group that will own the uploaded asset |
| Stud size | Bigger studs, fewer repeats on each face |
| Stud opacity | How dark the baked studs are; above 1.00 pushes them darker |

<details>
<summary>Pipeline server: Blender and gltfpack setup</summary>

```powershell
$env:ROBLOX_OPEN_CLOUD_API_KEY = "<your key>"
$env:ROBLOX_MESH_OPTIMIZER_BLENDER = "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"
$env:ROBLOX_MESH_OPTIMIZER_GLTFPACK = "C:\path\to\gltfpack.exe"
python backend/server.py
```

Blender is also found on `PATH` or in the default `C:\Program Files\Blender Foundation\Blender*` folder; `gltfpack` on `PATH`.

| Variable | Does |
|---|---|
| `ROBLOX_MESH_OPTIMIZER_USE_GLTF_TRANSFORM` | `1` runs `gltf-transform optimize` before `gltfpack` (`npm i -g @gltf-transform/cli`) |
| `ROBLOX_MESH_OPTIMIZER_GLTF_TRANSFORM` | Path to `gltf-transform` |
| `ROBLOX_MESH_OPTIMIZER_GLTFPACK_ARGS` | Extra `gltfpack` flags, e.g. `-cc -tc` |
| `ROBLOX_MESH_OPTIMIZER_HGR_ROWS` | HiddenGeometryRemoval camera rows |
| `ROBLOX_MESH_OPTIMIZER_HGR_CAMERAS_PER_ROW` | Cameras per row |
| `ROBLOX_MESH_OPTIMIZER_HGR_PRECISION` | e.g. `HIGH` |

Each job keeps its files in `backend/out/jobs/<job>/`: `source.glb`, `cleaned.glb` (uploaded to Roblox), `transformed.glb` (with gltf-transform) and `final.glb` (the `gltfpack` output, kept for comparison; Roblox's importer drops its texture, so it is not uploaded).

Self-test, which writes `backend/out/selftest.glb`: `python backend/server.py --self-test`

</details>

<details>
<summary>The backend reports <code>uploadConfigured: false</code></summary>

Check `Invoke-RestMethod http://127.0.0.1:8790/health` (or `:8788`). `uploadConfigured: false` means no API key reached the backend: paste it into the desktop app, or start the pipeline server from the same shell where you set `ROBLOX_OPEN_CLOUD_API_KEY`. `optimizerConfigured: false` means Blender or `gltfpack` was not found.

</details>

## Credits

- **HiddenGeometryRemoval** by Seungwoo Lee (MIT), vendored in `backend/vendor/`, removes hidden faces in the pipeline server.
- The stud texture is based on **dudeax/Roblox-HD-Studs**.
- Meshes are written with [trimesh](https://github.com/mikedh/trimesh) and packed with [gltfpack](https://github.com/zeux/meshoptimizer).
- The README pictures are drawn in code in [`docs/art/`](docs/art/); re-render them with `sh docs/art/render.sh`.
