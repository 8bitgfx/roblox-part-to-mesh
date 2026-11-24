# Part To Mesh Backend

The local backend for the roblox-part-to-mesh Studio plugin. See the [main README](../README.md).

- `app.py`: the desktop app (port 8790, API key in its setup window). Build it as an `.exe` with `build_exe.ps1`; the output is `dist\Part To Mesh Backend.exe`.
- `server.py`: the pipeline server (port 8788, Blender + gltfpack, key from `ROBLOX_OPEN_CLOUD_API_KEY`).

Settings and logs live in `%LOCALAPPDATA%\MeshToPartApp`.
