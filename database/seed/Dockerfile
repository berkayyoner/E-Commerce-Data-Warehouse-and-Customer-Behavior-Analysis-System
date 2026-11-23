# Loads the TPC-C data with BenchBase and enriches it for e-commerce analysis. Build context: the database folder.
FROM maven:3.9-eclipse-temurin-23 AS benchbase

# BenchBase needs Java 23 to build and run, so it is built here instead of on the host.
ARG BENCHBASE_COMMIT=33c00473807ebd49304d114a6d769d2d2b2bbb34
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN git init -q . \
    && git fetch -q --depth 1 https://github.com/cmu-db/benchbase.git ${BENCHBASE_COMMIT} \
    && git checkout -q FETCH_HEAD \
    && mvn -B -q clean package -P oracle -DskipTests \
    && mkdir /opt/benchbase \
    && tar -xzf target/benchbase-oracle.tgz -C /opt/benchbase --strip-components=1


FROM eclipse-temurin:23-jdk

RUN apt-get update && apt-get install -y --no-install-recommends curl unzip && rm -rf /var/lib/apt/lists/*

# SQLcl runs the enrichment script (SQL*Plus syntax) without an Oracle client installation.
RUN curl -fsSL -o /tmp/sqlcl.zip https://download.oracle.com/otn_software/java/sqldeveloper/sqlcl-latest.zip \
    && unzip -q /tmp/sqlcl.zip -d /opt \
    && rm /tmp/sqlcl.zip
ENV JAVA_TOOL_OPTIONS="-Dorg.jline.terminal.dumb=true -Dorg.jline.terminal.provider=dumb"

COPY --from=benchbase /opt/benchbase /opt/benchbase
COPY benchbase/tpcc_oracle.xml /seed/tpcc_oracle.xml
COPY enrichment/01_enrich_oltp.sql /seed/01_enrich_oltp.sql
COPY seed/seed.sh /seed/seed.sh
RUN chmod +x /seed/seed.sh

WORKDIR /opt/benchbase
ENTRYPOINT ["/seed/seed.sh"]
