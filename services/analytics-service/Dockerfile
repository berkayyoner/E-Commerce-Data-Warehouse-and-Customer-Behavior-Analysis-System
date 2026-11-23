# Build from the repository root: docker build -f services/analytics-service/Dockerfile -t analytics-service .
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY pom.xml ./
COPY services/analytics-service/pom.xml services/analytics-service/pom.xml
RUN mvn -q -B -pl services/analytics-service dependency:go-offline

COPY services/analytics-service/src services/analytics-service/src
RUN mvn -q -B -pl services/analytics-service -DskipTests package


FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S dwh && adduser -S dwh -G dwh

WORKDIR /app
COPY --from=build /workspace/services/analytics-service/target/analytics-service-*.jar app.jar

USER dwh
EXPOSE 8083

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-Duser.timezone=UTC", "-jar", "/app/app.jar"]
