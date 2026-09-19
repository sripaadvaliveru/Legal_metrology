#!/bin/sh
# Fix DATABASE_URL format for Spring Boot
if [ -n "$DATABASE_URL" ]; then
  export SPRING_DATASOURCE_URL=$(echo "$DATABASE_URL" | sed 's|^postgresql://|jdbc:postgresql://|')
fi

# Parse DB credentials from URL if not set
if [ -n "$DATABASE_URL" ] && [ -z "$SPRING_DATASOURCE_USERNAME" ]; then
  export SPRING_DATASOURCE_USERNAME=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
fi
if [ -n "$DATABASE_URL" ] && [ -z "$SPRING_DATASOURCE_PASSWORD" ]; then
  export SPRING_DATASOURCE_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
fi

exec java -jar app.jar
