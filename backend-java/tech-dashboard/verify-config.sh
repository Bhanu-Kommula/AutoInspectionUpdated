#!/bin/bash

echo "🔍 Verifying Tech Dashboard Configuration..."

echo ""
echo "📁 Current directory: $(pwd)"
echo "📁 Available application properties files:"
ls -la src/main/resources/application*.properties

echo ""
echo "🔧 Main application.properties content:"
echo "=== server.port ==="
grep "server.port" src/main/resources/application.properties || echo "No server.port found"
echo "=== context-path ==="
grep "context-path" src/main/resources/application.properties || echo "No context-path found"
echo "=== profiles ==="
grep "profiles.active" src/main/resources/application.properties || echo "No profiles.active found"

echo ""
echo "🚀 Render profile content:"
echo "=== server.port ==="
grep "server.port" src/main/resources/application-render.properties || echo "No server.port found"
echo "=== context-path ==="
grep "context-path" src/main/resources/application-render.properties || echo "No context-path found"

echo ""
echo "🏭 Production profile content:"
echo "=== server.port ==="
grep "server.port" src/main/resources/application-production.properties || echo "No server.port found"
echo "=== context-path ==="
grep "context-path" src/main/resources/application-production.properties || echo "No context-path found"

echo ""
echo "📋 Dockerfile content:"
echo "=== EXPOSE ==="
grep "EXPOSE" Dockerfile || echo "No EXPOSE found"

echo ""
echo "✅ Configuration verification complete!"
