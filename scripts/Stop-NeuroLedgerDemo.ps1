$ErrorActionPreference = "SilentlyContinue"

$ports = @(5173, 5050, 8000, 8545)

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped process on port $port"
  }
}

Write-Host "NeuroLedger demo services stopped."
