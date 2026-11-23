# Build from the repository root: docker build -f services/segmentation-service/Dockerfile -t segmentation-service .
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY pom.xml ./
COPY services/segmentation-service/pom.xml services/segmentation-service/pom.xml
RUN mvn -q -B -pl services/segmentation-service dependency:go-offline

COPY services/segmentation-service/src services/segmentation-service/src
RUN mvn -q -B -pl services/segmentation-service -DskipTests package


FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S dwh && adduser -S dwh -G dwh

WORKDIR /app
COPY --from=build /workspace/services/segmentation-service/target/segmentation-service-*.jar app.jar

USER dwh
EXPOSE 8084

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-Duser.timezone=UTC", "-jar", "/app/app.jar"]
