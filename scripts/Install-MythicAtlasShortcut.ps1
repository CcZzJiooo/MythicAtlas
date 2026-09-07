[CmdletBinding()]
param(
  [string]$ShortcutName = '山海经3D-一键启动.lnk'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$launcher = Join-Path $PSScriptRoot 'Launch-MythicAtlas.vbs'
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
  throw "Launcher not found: $launcher"
}

$shell = New-Object -ComObject WScript.Shell
$desktop = $shell.SpecialFolders.Item('Desktop')
$shortcutPath = Join-Path $desktop $ShortcutName
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $env:SystemRoot 'System32\wscript.exe'
$shortcut.Arguments = '"' + $launcher + '"'
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = 'Open MythicAtlas in the default browser without a command window.'
$shortcut.IconLocation = (Join-Path $env:SystemRoot 'System32\imageres.dll') + ',109'
$shortcut.Save()

Write-Output $shortcutPath
