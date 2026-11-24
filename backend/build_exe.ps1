$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

python -m PyInstaller `
  --noconfirm `
  --clean `
  --onefile `
  --windowed `
  --name "Part To Mesh Backend" `
  --add-data "assets\Studs 4x4 AO Diffuse.png;assets" `
  --add-data "assets\Studs 4x4 Normal.png;assets" `
  app.py
