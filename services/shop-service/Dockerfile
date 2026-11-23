# Build from the repository root: docker build -f services/shop-service/Dockerfile -t shop-service .
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace
COPY pom.xml ./
COPY services/shop-service/pom.xml services/shop-service/pom.xml
RUN mvn -q -B -pl services/shop-service dependency:go-offline

COPY services/shop-service/src services/shop-service/src
RUN mvn -q -B -pl services/shop-service -DskipTests package


FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S dwh && adduser -S dwh -G dwh

WORKDIR /app
COPY --from=build /workspace/services/shop-service/target/shop-service-*.jar app.jar

USER dwh
EXPOSE 8082

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-Duser.timezone=UTC", "-jar", "/app/app.jar"]
