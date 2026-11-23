#!/bin/bash
# Creates the read-only account of the report API. It owns nothing and can only select.
sqlplus -s / as sysdba <<SQL
ALTER SESSION SET CONTAINER = FREEPDB1;
CREATE USER dwh_reader IDENTIFIED BY "${READER_PASSWORD}";
GRANT CREATE SESSION TO dwh_reader;
EXIT;
SQL
