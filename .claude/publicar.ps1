# Sube los .gs/Index.html a Google y publica una nueva versión de la app (misma URL).
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File .claude\publicar.ps1 "descripción"
param([string]$Descripcion = 'Actualización')

$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
Set-Location (Split-Path -Parent $PSScriptRoot)

if (-not (Test-Path '.clasp.json')) {
  Write-Host 'Falta .clasp.json: primero hay que crear el proyecto de Apps Script (ver CLAUDE.md, "Primera vez").' -ForegroundColor Red
  exit 1
}

# SIEMPRE con la cuenta lfisbein (--user): la app corre como quien publica, y es lfisbein
# quien tiene aceptado el permiso de comprobar el inicio de sesión. El 26/11/2026 se publicó
# con la otra cuenta (buenasysantasmadrid) y la página dio "No tienes permiso para llamar a UrlFetchApp.fetch".
# clasp push BORRA en Google lo que no esté aquí: comprobar antes que no falte nada.
$id = (Get-Content '.clasp.json' -Raw | ConvertFrom-Json).scriptId
$tmp = Join-Path $env:TEMP ('clasp-escandallo-' + [guid]::NewGuid())
New-Item -ItemType Directory $tmp | Out-Null
Push-Location $tmp; clasp --user lfisbein clone $id | Out-Null; Pop-Location
$remotos = Get-ChildItem $tmp -Include *.js,*.html -Recurse
$faltan = $remotos | Where-Object { -not (Test-Path ($_.BaseName + '.gs')) -and -not (Test-Path ($_.BaseName + '.html')) }
if ($faltan) {
  Write-Host ('Faltan en este ordenador: ' + (($faltan | ForEach-Object BaseName) -join ', ') + '. No se sube nada.') -ForegroundColor Red
  exit 1
}

clasp --user lfisbein push --force
if ($LASTEXITCODE -ne 0) { Write-Host 'Falló la subida. No se publica.' -ForegroundColor Red; exit 1 }

# La implementación (URL /exec) se guarda en .claude\implementacion.txt la primera vez.
$archImpl = Join-Path $PSScriptRoot 'implementacion.txt'
if (Test-Path $archImpl) {
  $impl = (Get-Content $archImpl -Raw).Trim()
  clasp --user lfisbein deploy -i $impl -d $Descripcion
} else {
  $salida = (clasp --user lfisbein deploy -d $Descripcion | Out-String)
  Write-Host $salida
  $m = [regex]::Match($salida, '(AKfy[\w-]+)')
  if ($m.Success) { $m.Value | Set-Content $archImpl -Encoding utf8; Write-Host ('URL de la app: https://script.google.com/macros/s/' + $m.Value + '/exec') -ForegroundColor Green }
}
if ($LASTEXITCODE -ne 0) { Write-Host 'Falló la publicación.' -ForegroundColor Red; exit 1 }
Write-Host 'Listo: subido y publicado.' -ForegroundColor Green
