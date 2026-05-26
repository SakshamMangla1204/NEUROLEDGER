$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$logs = Join-Path $root "logs"
$backendEnv = Join-Path $root "backend\.env"

New-Item -ItemType Directory -Force -Path $logs | Out-Null

function Test-Port {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Stop-Port {
  param([int]$Port)
  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($connection) {
    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
  }
}

function Start-CmdService {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string]$Command,
    [int]$Port
  )

  if (Test-Port $Port) {
    Write-Host "$Name already running on port $Port"
    return
  }

  $logPath = Join-Path $logs "$Name.log"
  Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c $Command > `"$logPath`" 2>&1" `
    -WorkingDirectory $WorkingDirectory `
    -WindowStyle Hidden
  Start-Sleep -Seconds 4

  if (Test-Port $Port) {
    Write-Host "$Name started on port $Port"
  } else {
    Write-Host "$Name may still be starting. Check $logPath"
  }
}

function Set-EnvValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  $lines = Get-Content $Path
  $found = $false
  $next = foreach ($line in $lines) {
    if ($line -match "^$([regex]::Escape($Key))=") {
      $found = $true
      "$Key=$Value"
    } else {
      $line
    }
  }

  if (-not $found) {
    $next += "$Key=$Value"
  }

  Set-Content -Path $Path -Value $next
}

Write-Host "Starting NeuroLedger laptop demo..."

if (-not (Test-Path $backendEnv)) {
  Copy-Item (Join-Path $root "backend\.env.example") $backendEnv
}

if (-not (Test-Path (Join-Path $root "blockchain\node_modules"))) {
  Write-Host "Installing blockchain dependencies..."
  Push-Location (Join-Path $root "blockchain")
  npm.cmd install
  Pop-Location
}

if (-not (Test-Path (Join-Path $root "backend\node_modules"))) {
  Write-Host "Installing backend dependencies..."
  Push-Location (Join-Path $root "backend")
  npm.cmd install
  Pop-Location
}

if (-not (Test-Path (Join-Path $root "frontend\node_modules"))) {
  Write-Host "Installing frontend dependencies..."
  Push-Location (Join-Path $root "frontend")
  npm.cmd install
  Pop-Location
}

Start-CmdService `
  -Name "ganache" `
  -WorkingDirectory (Join-Path $root "blockchain") `
  -Command "node_modules\.bin\ganache.cmd --host 127.0.0.1 --port 8545 --chain.networkId 5777 --wallet.deterministic" `
  -Port 8545

Write-Host "Deploying smart contract to Ganache..."
Push-Location (Join-Path $root "blockchain")
$deployOutput = cmd.exe /c "npm.cmd run deploy 2>&1"
$deployExitCode = $LASTEXITCODE
Pop-Location
$deployOutput | Set-Content (Join-Path $logs "blockchain-deploy.log")

if ($deployExitCode -ne 0) {
  throw "Smart contract deploy failed. Check logs\blockchain-deploy.log"
}

$contractMatch = $deployOutput | Select-String -Pattern "contract address:\s+(0x[a-fA-F0-9]{40})" | Select-Object -Last 1

if (-not $contractMatch) {
  throw "Could not find deployed contract address. Check logs\blockchain-deploy.log"
}

$contractAddress = $contractMatch.Matches[0].Groups[1].Value
Set-EnvValue -Path $backendEnv -Key "BLOCKCHAIN_ENABLED" -Value "true"
Set-EnvValue -Path $backendEnv -Key "BLOCKCHAIN_RPC" -Value "http://127.0.0.1:8545"
Set-EnvValue -Path $backendEnv -Key "BLOCKCHAIN_RPC_URL" -Value "http://127.0.0.1:8545"
Set-EnvValue -Path $backendEnv -Key "CONTRACT_ADDRESS" -Value $contractAddress
Set-EnvValue -Path $backendEnv -Key "BLOCKCHAIN_CONTRACT_ADDRESS" -Value $contractAddress

Write-Host "Contract configured: $contractAddress"

Start-CmdService `
  -Name "ml-service" `
  -WorkingDirectory (Join-Path $root "ml-service") `
  -Command "..\venv\Scripts\python.exe -m uvicorn app:app --reload --host 127.0.0.1 --port 8000" `
  -Port 8000

Stop-Port 5050
Start-CmdService `
  -Name "backend" `
  -WorkingDirectory (Join-Path $root "backend") `
  -Command "npm.cmd run dev" `
  -Port 5050

Stop-Port 5173
Start-CmdService `
  -Name "frontend" `
  -WorkingDirectory (Join-Path $root "frontend") `
  -Command "npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort" `
  -Port 5173

Write-Host ""
Write-Host "NeuroLedger demo is ready:"
Write-Host "  Frontend:   http://127.0.0.1:5173"
Write-Host "  Backend:    http://127.0.0.1:5050"
Write-Host "  ML service: http://127.0.0.1:8000"
Write-Host "  Ganache:    http://127.0.0.1:8545"
Write-Host ""
Write-Host "Logs are in: $logs"
