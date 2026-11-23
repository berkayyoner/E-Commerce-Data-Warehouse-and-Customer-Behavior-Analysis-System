<#
.SYNOPSIS
    Stops the services and the web dev servers started by start-local.ps1. The containers keep running unless
    -Infrastructure is given.
#>
param(
    [switch]$Infrastructure
)

$root = Resolve-Path (Join-Path $PSScriptRoot '..')

Get-CimInstance Win32_Process | Where-Object {
    ($_.Name -eq 'java.exe' -and $_.CommandLine -like '*-service-0.1.0*') -or
    ($_.Name -eq 'node.exe' -and $_.CommandLine -like '*react-scripts*')
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

if ($Infrastructure) {
    Push-Location $root
    docker compose stop oracle-db redis elasticsearch
    Pop-Location
}
Write-Host 'Stopped.'
