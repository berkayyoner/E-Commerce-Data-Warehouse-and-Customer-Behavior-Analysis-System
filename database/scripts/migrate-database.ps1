<#
.SYNOPSIS
    Runs Flyway for one schema of the shop database (versioned scripts in database/migrations/<schema>).

.PARAMETER Schema
    olap (warehouse tables) or app (users). The OLTP schema is created by BenchBase, see database/README.md.

.PARAMETER Command
    Any Flyway command: migrate (default), info, validate, baseline, repair. Use baseline once on a database that
    already holds the objects of earlier versions, for example: -Command "baseline -baselineVersion=6".

.EXAMPLE
    .\migrate-database.ps1 -Schema olap
#>
param(
    [Parameter(Mandatory = $true)][ValidateSet('olap', 'app')][string]$Schema,
    [string]$Command = 'migrate'
)

$ErrorActionPreference = 'Continue'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Push-Location $projectRoot
try {
    docker compose --profile migrate run --rm "flyway-$Schema" $Command.Split(' ')
    if ($LASTEXITCODE -ne 0) { throw "Flyway failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}
