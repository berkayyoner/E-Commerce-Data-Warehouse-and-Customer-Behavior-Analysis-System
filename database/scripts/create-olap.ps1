<#
.SYNOPSIS
    Creates the star schema in the DWH_OLAP account. Existing warehouse tables are dropped first.
#>
$ErrorActionPreference = 'Continue'
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

$settings = @{}
Get-Content (Join-Path $projectRoot '.env') | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    $settings[$key.Trim()] = $value.Trim()
}
$connection = "dwh_olap/$($settings.OLAP_PASSWORD)@//localhost/FREEPDB1"

# The script text is copied into the container as a file, because piping text from Windows PowerShell
# puts a byte order mark in front of it and sqlplus does not accept that.
function Invoke-Sql([string]$script) {
    $local = Join-Path $env:TEMP 'dwh-olap-step.sql'
    [System.IO.File]::WriteAllText($local, $script, (New-Object System.Text.UTF8Encoding $false))
    docker cp $local dwh-oracle-db:/tmp/dwh-olap-step.sql
    docker exec dwh-oracle-db sqlplus -s $connection '@/tmp/dwh-olap-step.sql'
    if ($LASTEXITCODE -ne 0) { throw 'A SQL script failed.' }
}

# Drop in reverse dependency order; tables that do not exist yet are ignored.
$dropAll = @'
WHENEVER SQLERROR EXIT FAILURE ROLLBACK;
BEGIN
    FOR t IN (SELECT column_value AS name FROM TABLE(sys.odcivarchar2list(
        'FACT_INVENTORY_SNAPSHOT', 'FACT_SALES', 'FACT_ORDERS', 'ETL_QUALITY_RESULT', 'ETL_STEP', 'ETL_RUN',
        'ETL_WATERMARK', 'DIM_PAYMENT_METHOD', 'DIM_WAREHOUSE', 'DIM_PRODUCT', 'DIM_CUSTOMER', 'DIM_DATE'))) LOOP
        BEGIN
            EXECUTE IMMEDIATE 'DROP TABLE ' || t.name || ' CASCADE CONSTRAINTS PURGE';
        EXCEPTION WHEN OTHERS THEN
            IF SQLCODE != -942 THEN RAISE; END IF;
        END;
    END LOOP;
END;
/
EXIT;
'@
Invoke-Sql $dropAll

foreach ($file in '01_dimensions.sql', '02_facts.sql', '03_etl_support.sql', '04_load_dim_date.sql') {
    Write-Host "Running $file"
    Invoke-Sql ((Get-Content (Join-Path $projectRoot "database\olap\$file") -Raw) + "`nEXIT;`n")
}
Write-Host 'Star schema is ready.'
