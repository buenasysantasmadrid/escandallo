# Al abrir Claude Code en este proyecto: trae lo último de GitHub y compara el
# Apps Script de Google con los archivos de esta carpeta.
$ErrorActionPreference = 'Continue'
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
$avisos = @()

if (Test-Path '.git') {
  $pull = (git pull --ff-only 2>&1 | Out-String).Trim()
  if ($LASTEXITCODE -ne 0) { $avisos += "git pull FALLÓ (resolver antes de tocar nada): $pull" }
  elseif ($pull -match 'Already up to date|Ya está actualizado') { $avisos += 'git: al día con GitHub.' }
  else { $avisos += "git: bajados cambios. $pull" }
} else { $avisos += 'Esta carpeta todavía no está enlazada con GitHub (ver CLAUDE.md, "Primera vez").' }

if (-not (Test-Path 'DatosIniciales.gs')) { $avisos += 'Falta DatosIniciales.gs (no va a GitHub). Solo hace falta para instalar o reinstalar.' }

if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
  $avisos += 'clasp no está instalado en este ordenador.'
} elseif (-not (Test-Path '.clasp.json')) {
  $avisos += 'Falta .clasp.json: el proyecto de Apps Script todavía no está creado (ver CLAUDE.md, "Primera vez").'
} else {
  $id = (Get-Content '.clasp.json' -Raw | ConvertFrom-Json).scriptId
  $tmp = Join-Path $env:TEMP ('clasp-escandallo-' + [guid]::NewGuid())
  New-Item -ItemType Directory $tmp | Out-Null
  Push-Location $tmp; $clon = (clasp clone $id 2>&1 | Out-String); Pop-Location
  $remotos = Get-ChildItem $tmp -Include *.js,*.html -Recurse -ErrorAction SilentlyContinue
  if (-not $remotos) { $avisos += "No se pudo descargar el Apps Script de Google (¿clasp login?): $($clon.Trim())" }
  else {
    $norm = { param($p) ((Get-Content $p -Raw -Encoding UTF8) -replace "`r", '').TrimEnd() }
    $distintos = @()
    foreach ($r in $remotos) {
      $local = if ($r.Extension -eq '.js') { Join-Path $raiz ($r.BaseName + '.gs') } else { Join-Path $raiz $r.Name }
      if (-not (Test-Path $local)) { $distintos += "$($r.BaseName) (solo está en Google)" }
      elseif ((& $norm $r.FullName) -ne (& $norm $local)) { $distintos += "$($r.BaseName) (distinto)" }
    }
    if ($distintos.Count -eq 0) { $avisos += 'Apps Script: Google coincide con los archivos locales.' }
    else { $avisos += 'Apps Script DIFIERE de Google: ' + ($distintos -join ', ') + ". Copia de Google en: $tmp" }
  }
}

$texto = $avisos -join "`n"
@{ systemMessage = $texto; hookSpecificOutput = @{ hookEventName = 'SessionStart'; additionalContext = $texto } } | ConvertTo-Json -Compress
