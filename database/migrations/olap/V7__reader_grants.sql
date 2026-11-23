-- Read-only access to the warehouse for the report API (account DWH_READER, created with the database).
-- Every later migration that adds a table must grant SELECT on it in the same way.
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM all_users WHERE username = 'DWH_READER';
    IF v_count > 0 THEN
        FOR t IN (SELECT table_name AS object_name FROM user_tables
                   WHERE UPPER(table_name) NOT LIKE 'FLYWAY%'
                  UNION
                  SELECT mview_name FROM user_mviews) LOOP
            EXECUTE IMMEDIATE 'GRANT SELECT ON "' || t.object_name || '" TO dwh_reader';
        END LOOP;
    END IF;
END;
/
