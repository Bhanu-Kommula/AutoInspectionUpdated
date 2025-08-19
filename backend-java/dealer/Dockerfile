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

# Expose the port
EXPOSE 8080

# Run the application with explicit JAR path
CMD ["sh", "-c", "JAR_FILE=$(find target/ -name '*.jar' -type f | head -1) && echo 'Using JAR: $JAR_FILE' && java -jar \"$JAR_FILE\""]
