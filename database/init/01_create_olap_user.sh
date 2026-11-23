#!/bin/bash
# Creates the warehouse owner next to the OLTP owner (dwh_oltp is created by the image through APP_USER).
sqlplus -s / as sysdba <<SQL
ALTER SESSION SET CONTAINER = FREEPDB1;
CREATE USER dwh_olap IDENTIFIED BY "${OLAP_PASSWORD}" DEFAULT TABLESPACE users QUOTA UNLIMITED ON users;
GRANT CREATE SESSION, CREATE TABLE, CREATE VIEW, CREATE MATERIALIZED VIEW, CREATE SEQUENCE, CREATE PROCEDURE TO dwh_olap;
-- The ETL reads the OLTP tables with this account.
GRANT SELECT ANY TABLE TO dwh_olap;
EXIT;
SQL
