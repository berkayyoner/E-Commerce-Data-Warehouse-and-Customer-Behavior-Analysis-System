-- Fills dim_date for 2024-2027 (order and delivery dates fall inside this range). Run as DWH_OLAP.

INSERT INTO dim_date (date_key, full_date, day_of_month, day_of_week, day_name, week_of_year,
                      month_number, month_name, quarter_number, year_number, year_month, is_weekend)
SELECT TO_NUMBER(TO_CHAR(d, 'YYYYMMDD')),
       d,
       TO_NUMBER(TO_CHAR(d, 'DD')),
       TRUNC(d) - TRUNC(d, 'IW') + 1,
       TRIM(TO_CHAR(d, 'Day', 'NLS_DATE_LANGUAGE=ENGLISH')),
       TO_NUMBER(TO_CHAR(d, 'IW')),
       TO_NUMBER(TO_CHAR(d, 'MM')),
       TRIM(TO_CHAR(d, 'Month', 'NLS_DATE_LANGUAGE=ENGLISH')),
       TO_NUMBER(TO_CHAR(d, 'Q')),
       TO_NUMBER(TO_CHAR(d, 'YYYY')),
       TO_CHAR(d, 'YYYY-MM'),
       CASE WHEN TRUNC(d) - TRUNC(d, 'IW') >= 5 THEN 'Y' ELSE 'N' END
  FROM (SELECT DATE '2024-01-01' + LEVEL - 1 AS d FROM dual CONNECT BY LEVEL <= 1461);

COMMIT;
