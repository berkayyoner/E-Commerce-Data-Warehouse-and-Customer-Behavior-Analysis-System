<#
.SYNOPSIS
    Starts the whole system on this machine: infrastructure containers, the five services and the React app.

.DESCRIPTION
    Reads the passwords from .env, starts Oracle, Redis and Elasticsearch with Docker Compose, then every service
    from its jar (built first when -Build is given or a jar is missing) and the web app with its dev server on port 3000.
    Logs are written to the logs folder. Stop everything with stop-local.ps1.

.PARAMETER Build
    Rebuild the jars before starting.

.PARAMETER AdminPassword
    Password of the first administrator that the auth service creates in an empty user table.

.EXAMPLE
    .\scripts\start-local.ps1 -Build
#>
param(
    [switch]$Build,
    [string]$AdminPassword = 'Admin-Local-2026'
)

# Docker and npm write progress to stderr, so failures are detected through exit codes instead.
$ErrorActionPreference = 'Continue'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$logs = Join-Path $root 'logs'
New-Item -ItemType Directory -Force $logs | Out-Null

$settings = @{}
Get-Content (Join-Path $root '.env') | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    $settings[$key.Trim()] = $value.Trim()
}

Write-Host 'Starting Oracle, Redis and Elasticsearch...'
Push-Location $root
docker compose up -d oracle-db redis elasticsearch
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose could not start the containers.' }
Pop-Location

Write-Host 'Waiting for Oracle to accept connections...'
for ($i = 0; $i -lt 60; $i++) {
    $health = docker inspect --format '{{.State.Health.Status}}' dwh-oracle-db
    if ($health -eq 'healthy') { break }
    Start-Sleep -Seconds 5
}
if ($health -ne 'healthy') { throw 'Oracle did not become healthy in time.' }

$services = @('auth', 'etl', 'shop', 'analytics', 'segmentation')
if ($Build -or ($services | Where-Object { -not (Test-Path (Join-Path $root "services\$_-service\target\$_-service-0.1.0-SNAPSHOT.jar")) })) {
    Write-Host 'Building the services...'
    Push-Location $root
    & .\mvnw.cmd -B -q -DskipTests package
    if ($LASTEXITCODE -ne 0) { throw 'The Maven build failed.' }
    Pop-Location
}

# Passwords and addresses the services read from their environment.
$env:APP_DB_PASSWORD = $settings.APP_DB_PASSWORD
$env:AUTH_ADMIN_PASSWORD = $AdminPassword
$env:OLAP_PASSWORD = $settings.OLAP_PASSWORD
$env:OLTP_DB_PASSWORD = $settings.OLTP_PASSWORD
$env:ANALYTICS_DB_PASSWORD = $settings.READER_PASSWORD

foreach ($service in $services) {
    $jar = Join-Path $root "services\$service-service\target\$service-service-0.1.0-SNAPSHOT.jar"
    Write-Host "Starting $service-service..."
    Start-Process -FilePath java -ArgumentList '-Duser.timezone=UTC', '-jar', $jar `
        -RedirectStandardOutput (Join-Path $logs "$service-service.log") `
        -RedirectStandardError (Join-Path $logs "$service-service.err.log") -WindowStyle Hidden
}

$folder = Join-Path $root 'web\dwh-web'
if (-not (Test-Path (Join-Path $folder 'node_modules'))) {
    Write-Host 'Installing the packages of the web app...'
    Push-Location $folder
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed in dwh-web' }
    Pop-Location
}
Write-Host 'Starting the web app...'
# The dev server port is set here so a PORT in .env.development cannot override it.
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "cd /d `"$folder`" && set PORT=3000&& npm start > `"$(Join-Path $logs 'dwh-web.log')`" 2>&1" -WindowStyle Hidden

$ports = @{ 'auth-service' = 9000; 'etl-service' = 8081; 'shop-service' = 8082; 'analytics-service' = 8083; 'segmentation-service' = 8084 }
Write-Host 'Waiting for the services to report healthy...'
for ($i = 0; $i -lt 40; $i++) {
    $down = @()
    foreach ($name in $ports.Keys) {
        try {
            $status = (Invoke-RestMethod "http://localhost:$($ports[$name])/actuator/health" -TimeoutSec 3).status
            if ($status -ne 'UP') { $down += $name }
        }
        catch { $down += $name }
    }
    if ($down.Count -eq 0) { break }
    Start-Sleep -Seconds 3
}
if ($down.Count -gt 0) { throw "These services are not healthy: $($down -join ', '). See the logs folder." }

Write-Host ''
Write-Host 'Everything is up:'
Write-Host '  Web app             http://localhost:3000'
Write-Host '  Auth server         http://localhost:9000'
Write-Host "  First administrator admin / $AdminPassword (created only when the user table is empty)"
