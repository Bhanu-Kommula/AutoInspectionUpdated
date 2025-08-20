FROM maven:3.9.6

WORKDIR /app

# Copy pom.xml first for better layer caching
COPY pom.xml .

# Copy source code
COPY src ./src

# Copy startup script
COPY startup.sh ./startup.sh

# Build the application with verbose output
RUN mvn clean package -DskipTests -X

# Debug: List what was created
RUN ls -la target/
RUN find target/ -name "*.jar" -type f

# Expose the port (will be overridden by Render)
EXPOSE 8085

# Make startup script executable
RUN chmod +x startup.sh

# Run the application using the startup script
CMD ["./startup.sh"]
