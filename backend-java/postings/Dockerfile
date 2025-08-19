FROM maven:3.9.6

WORKDIR /app

# Copy pom.xml first for better layer caching
COPY pom.xml .

# Copy source code
COPY src ./src

# Build the application with verbose output
RUN mvn clean package -DskipTests -X

# Debug: List what was created
RUN ls -la target/
RUN find target/ -name "*.jar" -type f

# Expose the port (will be overridden by Render)
EXPOSE 8081

# Run the application with proper environment variable handling
CMD bash -lc '\
  : ${PORT:=8081}; \
  if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ] && [ -n "$DB_NAME" ]; then \
    export SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"; \
  fi; \
  echo "Using SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL"; \
  echo "Using PORT=$PORT"; \
  JAR_FILE=$(find target/ -name "*.jar" -type f | head -1); \
  echo "Using JAR: $JAR_FILE"; \
  java ${JAVA_OPTS:-"-XX:MaxRAMPercentage=75.0"} -Dserver.port=$PORT -jar "$JAR_FILE"'
