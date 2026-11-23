# Build from the repository root: docker build -f services/shop-service/Dockerfile -t dwh/shop-service .
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace
# The parent pom lists every module, so all module poms must be present for Maven to load the project.
COPY pom.xml ./
COPY services/auth-service/pom.xml services/auth-service/pom.xml
COPY services/etl-service/pom.xml services/etl-service/pom.xml
COPY services/shop-service/pom.xml services/shop-service/pom.xml
COPY services/analytics-service/pom.xml services/analytics-service/pom.xml
COPY services/segmentation-service/pom.xml services/segmentation-service/pom.xml
RUN mvn -q -B -pl services/shop-service dependency:go-offline

COPY services/shop-service/src services/shop-service/src
RUN mvn -q -B -pl services/shop-service -DskipTests package


FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S dwh && adduser -S dwh -G dwh

WORKDIR /app
COPY --from=build /workspace/services/shop-service/target/shop-service-*.jar app.jar

USER dwh
EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8082/actuator/health/liveness || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-Duser.timezone=UTC", "-jar", "/app/app.jar"]
