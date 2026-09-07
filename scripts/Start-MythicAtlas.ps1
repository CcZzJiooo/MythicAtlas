[CmdletBinding()]
param(
  [switch]$NoBrowser,
  [switch]$Development,
  [ValidateRange(1, 65535)]
  [int]$PreferredPort = 4173,
  [ValidateRange(5, 120)]
  [int]$StartupTimeoutSeconds = 35
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$localAppData = [Environment]::GetFolderPath('LocalApplicationData')
$runtimeDirectory = Join-Path $localAppData 'MythicAtlas'
$logDirectory = Join-Path $runtimeDirectory 'logs'
$launcherLog = Join-Path $logDirectory 'launcher.log'
$serverOutputLog = Join-Path $logDirectory 'server.stdout.log'
$serverErrorLog = Join-Path $logDirectory 'server.stderr.log'
$installLog = Join-Path $logDirectory 'npm-install.log'
$buildLog = Join-Path $logDirectory 'build.log'
$runtimeFile = Join-Path $runtimeDirectory 'instance.json'
$marker = '<meta name="mythic-atlas-server" content="1"'
$candidatePorts = $PreferredPort..([Math]::Min(65535, $PreferredPort + 17))
$desiredMode = if ($Development) { 'development' } else { 'preview' }
$savedRuntime = $null
$mutex = New-Object System.Threading.Mutex($false, 'Local\MythicAtlasLauncher')
$lockTaken = $false
$startedProcess = $null

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

function Write-LauncherLog {
  param([string]$Message)

  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff'
  Add-Content -LiteralPath $launcherLog -Value "[$timestamp] $Message" -Encoding UTF8
}

function Show-LauncherError {
  param([string]$Message)

  try {
    Add-Type -AssemblyName System.Windows.Forms
    $body = "$Message`r`n`r`nDetails:`r`n$launcherLog"
    [System.Windows.Forms.MessageBox]::Show(
      $body,
      'MythicAtlas could not start',
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
  }
  catch {
    Write-LauncherLog "Unable to show the error dialog: $($_.Exception.Message)"
  }
}

function Test-PortListening {
  param([int]$Port)

  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $pending = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
    if (-not $pending.AsyncWaitHandle.WaitOne(250)) {
      return $false
    }
    $client.EndConnect($pending)
    return $true
  }
  catch {
    return $false
  }
  finally {
    $client.Close()
  }
}

function Test-MythicAtlasHealth {
  param([int]$Port)

  if (-not (Test-PortListening -Port $Port)) {
    return $false
  }

  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200 -and $response.Content.Contains($marker)
  }
  catch {
    return $false
  }
}

function Open-MythicAtlas {
  param([int]$Port)

  $url = "http://127.0.0.1:$Port/"
  Write-LauncherLog "MythicAtlas is healthy at $url"
  if (-not $NoBrowser) {
    Start-Process -FilePath $url | Out-Null
    Write-LauncherLog 'Opened the default browser.'
  }
  else {
    Write-Output $url
  }
}

function Find-Executable {
  param(
    [string]$CommandName,
    [string[]]$FallbackPaths
  )

  $command = Get-Command $CommandName -ErrorAction SilentlyContinue
  if ($null -ne $command) {
    return $command.Source
  }

  foreach ($fallbackPath in $FallbackPaths) {
    if (Test-Path -LiteralPath $fallbackPath -PathType Leaf) {
      return $fallbackPath
    }
  }

  return $null
}

function Invoke-NpmStep {
  param(
    [string]$NpmPath,
    [string[]]$Arguments,
    [string]$OutputLog,
    [string]$Label
  )

  Write-LauncherLog "$Label started. Output: $OutputLog"
  Push-Location -LiteralPath $projectRoot
  try {
    & $NpmPath @Arguments *> $OutputLog
    $exitCode = $LASTEXITCODE
  }
  finally {
    Pop-Location
  }

  if ($exitCode -ne 0) {
    throw "$Label failed with exit code $exitCode. See $OutputLog"
  }
  Write-LauncherLog "$Label completed."
}

function Test-BuildRequired {
  $distIndex = Join-Path $projectRoot 'dist\index.html'
  if (-not (Test-Path -LiteralPath $distIndex -PathType Leaf)) {
    return $true
  }

  $distWriteTime = (Get-Item -LiteralPath $distIndex).LastWriteTimeUtc
  $sourcePaths = @(
    (Join-Path $projectRoot 'index.html'),
    (Join-Path $projectRoot 'package.json'),
    (Join-Path $projectRoot 'package-lock.json'),
    (Join-Path $projectRoot 'tsconfig.json'),
    (Join-Path $projectRoot 'vite.config.ts'),
    (Join-Path $projectRoot 'src'),
    (Join-Path $projectRoot 'public')
  )

  foreach ($sourcePath in $sourcePaths) {
    if (-not (Test-Path -LiteralPath $sourcePath)) {
      continue
    }

    $item = Get-Item -LiteralPath $sourcePath
    if (-not $item.PSIsContainer) {
      if ($item.LastWriteTimeUtc -gt $distWriteTime) {
        return $true
      }
      continue
    }

    $newerFile = Get-ChildItem -LiteralPath $sourcePath -Recurse -File |
      Where-Object { $_.LastWriteTimeUtc -gt $distWriteTime } |
      Select-Object -First 1
    if ($null -ne $newerFile) {
      return $true
    }
  }

  return $false
}

try {
  try {
    $lockTaken = $mutex.WaitOne([TimeSpan]::FromSeconds(45))
  }
  catch [System.Threading.AbandonedMutexException] {
    $lockTaken = $true
  }

  if (-not $lockTaken) {
    throw 'Another MythicAtlas launcher is still working. Please try again in a moment.'
  }

  Write-LauncherLog "Launch requested from $projectRoot"

  if (Test-Path -LiteralPath $runtimeFile -PathType Leaf) {
    try {
      $savedRuntime = Get-Content -LiteralPath $runtimeFile -Raw | ConvertFrom-Json
      $savedMode = if ($savedRuntime.PSObject.Properties.Name -contains 'mode') { [string]$savedRuntime.mode } else { 'preview' }
      if ($savedRuntime.projectRoot -eq $projectRoot -and $savedMode -eq $desiredMode -and (Test-MythicAtlasHealth -Port ([int]$savedRuntime.port))) {
        Write-LauncherLog "Reusing managed instance PID $($savedRuntime.pid) on port $($savedRuntime.port)."
        Open-MythicAtlas -Port ([int]$savedRuntime.port)
        return
      }
      Write-LauncherLog 'Ignoring a stale managed-instance record.'
    }
    catch {
      Write-LauncherLog "Ignoring an unreadable managed-instance record: $($_.Exception.Message)"
    }
  }

  $availablePort = $null
  foreach ($candidatePort in $candidatePorts) {
    $isManagedCandidate = $null -ne $savedRuntime -and $savedRuntime.projectRoot -eq $projectRoot -and $savedRuntime.mode -eq $desiredMode -and [int]$savedRuntime.port -eq $candidatePort
    if ($isManagedCandidate -and (Test-MythicAtlasHealth -Port $candidatePort)) {
      Write-LauncherLog "Reusing the matching managed MythicAtlas service on port $candidatePort."
      Open-MythicAtlas -Port $candidatePort
      return
    }
    if (Test-PortListening -Port $candidatePort) {
      if (Test-MythicAtlasHealth -Port $candidatePort) {
        Write-LauncherLog "Skipping healthy but unmanaged or mismatched service on port $candidatePort."
      }
      continue
    }
    if ($null -eq $availablePort) {
      $availablePort = $candidatePort
    }
  }

  if ($null -eq $availablePort) {
    throw "No free local port was found in the range $($candidatePorts[0])-$($candidatePorts[-1])."
  }

  $nodePath = Find-Executable -CommandName 'node.exe' -FallbackPaths @(
    "$env:ProgramFiles\nodejs\node.exe",
    "${env:ProgramFiles(x86)}\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
  )
  if ([string]::IsNullOrWhiteSpace($nodePath)) {
    throw 'Node.js was not found. Install Node.js 22 or newer, then open the shortcut again.'
  }

  $npmPath = Find-Executable -CommandName 'npm.cmd' -FallbackPaths @(
    (Join-Path (Split-Path -Parent $nodePath) 'npm.cmd'),
    "$env:ProgramFiles\nodejs\npm.cmd",
    "${env:ProgramFiles(x86)}\nodejs\npm.cmd"
  )
  if ([string]::IsNullOrWhiteSpace($npmPath)) {
    throw 'npm.cmd was not found next to Node.js.'
  }

  $viteScript = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'
  if (-not (Test-Path -LiteralPath $viteScript -PathType Leaf)) {
    Invoke-NpmStep -NpmPath $npmPath -Arguments @('ci', '--no-audit', '--no-fund') -OutputLog $installLog -Label 'Dependency installation'
  }
  if (-not (Test-Path -LiteralPath $viteScript -PathType Leaf)) {
    throw "Vite is still missing after dependency installation: $viteScript"
  }

  if ($Development) {
    Write-LauncherLog 'Development mode selected; skipping production build so Vite serves current source with HMR.'
  }
  elseif (Test-BuildRequired) {
    Invoke-NpmStep -NpmPath $npmPath -Arguments @('run', 'build') -OutputLog $buildLog -Label 'Production build'
  }
  else {
    Write-LauncherLog 'Existing production build is current.'
  }

  $quotedViteScript = '"' + $viteScript + '"'
  $viteMode = if ($Development) { 'dev' } else { 'preview' }
  $serverArguments = @(
    $quotedViteScript,
    $viteMode,
    '--host',
    '127.0.0.1',
    '--port',
    [string]$availablePort,
    '--strictPort'
  )
  Write-LauncherLog "Starting hidden Vite $viteMode on port $availablePort."
  $startedProcess = Start-Process -FilePath $nodePath `
    -ArgumentList $serverArguments `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $serverOutputLog `
    -RedirectStandardError $serverErrorLog `
    -PassThru

  $runtimeState = [ordered]@{
    projectRoot = $projectRoot
    mode = $desiredMode
    port = $availablePort
    pid = $startedProcess.Id
    url = "http://127.0.0.1:$availablePort/"
    node = $nodePath
    vite = $viteScript
    startedAt = (Get-Date).ToString('o')
  }
  $runtimeState | ConvertTo-Json | Set-Content -LiteralPath $runtimeFile -Encoding UTF8
  Write-LauncherLog "Started Vite $viteMode PID $($startedProcess.Id)."

  $deadline = [DateTime]::UtcNow.AddSeconds($StartupTimeoutSeconds)
  while ([DateTime]::UtcNow -lt $deadline) {
    if ($startedProcess.HasExited) {
      throw "The preview process exited with code $($startedProcess.ExitCode). See $serverErrorLog"
    }
    if (Test-MythicAtlasHealth -Port $availablePort) {
      Open-MythicAtlas -Port $availablePort
      return
    }
    Start-Sleep -Milliseconds 250
  }

  throw "MythicAtlas did not become healthy within $StartupTimeoutSeconds seconds. See $serverErrorLog"
}
catch {
  $message = $_.Exception.Message
  Write-LauncherLog "Launch failed: $message"
  if ($null -ne $startedProcess -and -not $startedProcess.HasExited) {
    try {
      Stop-Process -Id $startedProcess.Id -Force -ErrorAction Stop
      Write-LauncherLog "Stopped failed preview PID $($startedProcess.Id)."
    }
    catch {
      Write-LauncherLog "Unable to stop failed preview PID $($startedProcess.Id): $($_.Exception.Message)"
    }
  }
  Show-LauncherError -Message $message
  exit 1
}
finally {
  if ($lockTaken) {
    $mutex.ReleaseMutex()
  }
  $mutex.Dispose()
}
