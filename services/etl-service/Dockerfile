# Build from the repository root: docker build -f services/etl-service/Dockerfile -t etl-service .
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY pom.xml ./
COPY services/etl-service/pom.xml services/etl-service/pom.xml
RUN mvn -q -B -pl services/etl-service dependency:go-offline

COPY services/etl-service/src services/etl-service/src
RUN mvn -q -B -pl services/etl-service -DskipTests package


FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S dwh && adduser -S dwh -G dwh

WORKDIR /app
COPY --from=build /workspace/services/etl-service/target/etl-service-*.jar app.jar

USER dwh
EXPOSE 8081

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-Duser.timezone=UTC", "-jar", "/app/app.jar"]
