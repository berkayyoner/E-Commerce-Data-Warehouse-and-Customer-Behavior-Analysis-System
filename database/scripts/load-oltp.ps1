<#
.SYNOPSIS
    Creates the TPC-C (OLTP) tables with BenchBase, loads them, runs a short workload and enriches the data.

.PARAMETER BenchBaseHome
    Folder with the unpacked BenchBase Oracle distribution (benchbase.jar and lib/).

.PARAMETER ScaleFactor
    Number of warehouses. 10 gives about 300,000 customers and 3 million order lines.

.PARAMETER WorkloadSeconds
    Length of the transaction workload that runs after the load. 0 skips it.

.EXAMPLE
    .\load-oltp.ps1 -BenchBaseHome C:\tools\benchbase -ScaleFactor 10
#>
param(
    [Parameter(Mandatory = $true)][string]$BenchBaseHome,
    [int]$ScaleFactor = 10,
    [int]$WorkloadSeconds = 120,
    [int]$Terminals = 8
)

# Docker writes progress to stderr, so failures are detected through exit codes instead.
$ErrorActionPreference = 'Continue'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$envFile = Join-Path $projectRoot '.env'
if (-not (Test-Path $envFile)) { throw ".env was not found in $projectRoot. Copy .env.example first." }

$settings = @{}
Get-Content $envFile | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    $settings[$key.Trim()] = $value.Trim()
}

$workDir = Join-Path $env:TEMP 'dwh-benchbase'
New-Item -ItemType Directory -Force $workDir | Out-Null
$configPath = Join-Path $workDir 'tpcc_oracle.xml'

$config = Get-Content (Join-Path $projectRoot 'database\benchbase\tpcc_oracle.xml') -Raw
$config = $config.Replace('@DB_HOST@', 'host.docker.internal').
    Replace('@DB_PORT@', $(if ($settings.DB_PORT) { $settings.DB_PORT } else { '1521' })).
    Replace('@OLTP_PASSWORD@', $settings.OLTP_PASSWORD).
    Replace('@SCALE_FACTOR@', $ScaleFactor).
    Replace('@TERMINALS@', $Terminals).
    Replace('@WORKLOAD_SECONDS@', [Math]::Max($WorkloadSeconds, 1))
Set-Content -Path $configPath -Value $config -Encoding utf8

# BenchBase 2023+ needs Java 23, so it runs in a container instead of on the host JDK.
function Invoke-BenchBase([string]$arguments) {
    # BenchBase reads config/plugin.xml relative to its own folder and writes its results next to it.
    docker run --rm -v "${BenchBaseHome}:/benchbase" -v "${workDir}:/work" -w /benchbase `
        eclipse-temurin:23-jre java -jar /benchbase/benchbase.jar -b tpcc -c /work/tpcc_oracle.xml $arguments.Split(' ')
    if ($LASTEXITCODE -ne 0) { throw "BenchBase failed with exit code $LASTEXITCODE" }
}

Write-Host "Creating and loading TPC-C with $ScaleFactor warehouses..."
Invoke-BenchBase '--create=true --load=true'

if ($WorkloadSeconds -gt 0) {
    Write-Host "Running the transaction workload for $WorkloadSeconds seconds..."
    Invoke-BenchBase '--execute=true'
}

Write-Host 'Enriching the data for e-commerce analysis...'
# The script is copied into the container as a file because piped text from Windows PowerShell starts with a
# byte order mark that sqlplus rejects.
docker cp (Join-Path $projectRoot 'database\enrichment\01_enrich_oltp.sql') dwh-oracle-db:/tmp/01_enrich_oltp.sql
docker exec dwh-oracle-db sqlplus -s "dwh_oltp/$($settings.OLTP_PASSWORD)@//localhost/FREEPDB1" '@/tmp/01_enrich_oltp.sql'
if ($LASTEXITCODE -ne 0) { throw 'The enrichment script failed.' }

Write-Host 'OLTP data is ready.'
