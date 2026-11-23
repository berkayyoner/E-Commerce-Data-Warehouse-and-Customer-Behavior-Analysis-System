#!/bin/bash
# Creates the account that owns the application tables (users and roles).
sqlplus -s / as sysdba <<SQL
ALTER SESSION SET CONTAINER = FREEPDB1;
CREATE USER dwh_app IDENTIFIED BY "${APP_DB_PASSWORD}" DEFAULT TABLESPACE users QUOTA UNLIMITED ON users;
GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO dwh_app;
EXIT;
SQL
