<#
.SYNOPSIS
    Compares the warehouse with the OLTP schema (row counts, revenue, units, deliveries, revenue per month) and
    fails when they differ. Run it after every ETL run.
#>
$ErrorActionPreference = 'Continue'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

$settings = @{}
Get-Content (Join-Path $projectRoot '.env') | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    $settings[$key.Trim()] = $value.Trim()
}

# The script is copied into the container as a file, because piped text from Windows PowerShell starts with a
# byte order mark that sqlplus rejects.
docker cp (Join-Path $projectRoot 'database\tests\reconciliation.sql') dwh-oracle-db:/tmp/reconciliation.sql
docker exec dwh-oracle-db sqlplus -s "dwh_olap/$($settings.OLAP_PASSWORD)@//localhost/FREEPDB1" '@/tmp/reconciliation.sql'
if ($LASTEXITCODE -ne 0) { throw 'The warehouse does not match the OLTP schema.' }
Write-Host 'The warehouse matches the OLTP schema.'
