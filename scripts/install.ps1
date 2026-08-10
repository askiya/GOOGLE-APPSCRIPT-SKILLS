param(
  [string]$Skill,
  [string]$Destination = (Join-Path $HOME '.agents\skills'),
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$skillsRoot = Join-Path $repoRoot 'skills'

if (-not (Test-Path -LiteralPath $skillsRoot -PathType Container)) {
  throw "Skills directory not found: $skillsRoot"
}

$sourceDirs = if ($Skill) {
  $candidate = Join-Path $skillsRoot $Skill
  if (-not (Test-Path -LiteralPath $candidate -PathType Container)) {
    $available = (Get-ChildItem -LiteralPath $skillsRoot -Directory).Name -join ', '
    throw "Unknown skill '$Skill'. Available: $available"
  }
  @(Get-Item -LiteralPath $candidate)
} else {
  @(Get-ChildItem -LiteralPath $skillsRoot -Directory)
}

New-Item -ItemType Directory -Path $Destination -Force | Out-Null
$installed = @()

foreach ($source in $sourceDirs) {
  $target = Join-Path $Destination $source.Name
  if (Test-Path -LiteralPath $target) {
    if (-not $Force) {
      throw "Target already exists: $target. Re-run with -Force to replace it."
    }
    $resolvedDestination = (Resolve-Path -LiteralPath $Destination).Path
    $resolvedTarget = (Resolve-Path -LiteralPath $target).Path
    if (-not $resolvedTarget.StartsWith($resolvedDestination, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to remove a target outside the destination: $resolvedTarget"
    }
    Remove-Item -LiteralPath $resolvedTarget -Recurse -Force
  }
  Copy-Item -LiteralPath $source.FullName -Destination $target -Recurse
  $installed += $source.Name
}

Write-Output ("Installed {0} skill(s) to {1}: {2}" -f $installed.Count, $Destination, ($installed -join ', '))
Write-Output 'Restart Codex if the skills do not appear automatically.'
