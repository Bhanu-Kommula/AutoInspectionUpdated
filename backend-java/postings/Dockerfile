FROM maven:3.9.6-openjdk-17

WORKDIR /app

# Copy pom.xml first for better layer caching
COPY pom.xml .

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Expose the port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/postings-*.jar"]
