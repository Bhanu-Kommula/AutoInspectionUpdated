#!/bin/bash

# AutoInspect Project - Render Deployment Script
# This script helps prepare and deploy your project to Render

echo "🚀 AutoInspect Project - Render Deployment Preparation"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

# Check if all required files exist
echo "📋 Checking required files..."

required_files=(
    "frontend/dealer-frontend/package.json"
    "backend-java/gateway/pom.xml"
    "backend-java/dealer/pom.xml"
    "backend-java/postings/pom.xml"
    "backend-java/tech-dashboard/pom.xml"
    "backend-java/serviceregistry/pom.xml"
    "backend-node/chat-service/package.json"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Missing required files:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

echo "✅ All required files found"

# Check if Dockerfiles exist
echo "🐳 Checking Dockerfiles..."

dockerfiles=(
    "backend-java/gateway/Dockerfile"
    "backend-java/dealer/Dockerfile"
    "backend-java/postings/Dockerfile"
    "backend-java/tech-dashboard/Dockerfile"
    "backend-java/serviceregistry/Dockerfile"
)

missing_dockerfiles=()
for file in "${dockerfiles[@]}"; do
    if [ ! -f "$file" ]; then
        missing_dockerfiles+=("$file")
    fi
done

if [ ${#missing_dockerfiles[@]} -ne 0 ]; then
    echo "❌ Missing Dockerfiles:"
    for file in "${missing_dockerfiles[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

echo "✅ All Dockerfiles found"

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found. Please create it first."
    exit 1
fi

echo "✅ render.yaml found"

# Check production configurations
echo "⚙️ Checking production configurations..."

prod_configs=(
    "backend-java/application-production.properties"
    "backend-java/gateway/src/main/resources/application-production.properties"
)

missing_configs=()
for file in "${prod_configs[@]}"; do
    if [ ! -f "$file" ]; then
        missing_configs+=("$file")
    fi
done

if [ ${#missing_configs[@]} -ne 0 ]; then
    echo "❌ Missing production configurations:"
    for file in "${missing_configs[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

echo "✅ Production configurations found"

# Test builds locally
echo "🔨 Testing local builds..."

echo "Testing frontend build..."
cd frontend/dealer-frontend
if npm run build; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ../..

echo "Testing Java services compilation..."
for service in gateway dealer postings tech-dashboard serviceregistry; do
    echo "Testing $service..."
    cd "backend-java/$service"
    if ./mvnw clean compile -q; then
        echo "✅ $service compilation successful"
    else
        echo "❌ $service compilation failed"
        exit 1
    fi
    cd ../..
done

echo "Testing Node.js chat service..."
cd backend-node/chat-service
if npm install --silent; then
    echo "✅ Chat service dependencies installed"
else
    echo "❌ Chat service dependency installation failed"
    exit 1
fi
cd ../..

# Test Docker builds
echo "🐳 Testing Docker builds..."

for service in gateway dealer postings tech-dashboard serviceregistry; do
    echo "Building $service Docker image..."
    cd "backend-java/$service"
    if docker build -t test-$service . > /dev/null 2>&1; then
        echo "✅ $service Docker build successful"
    else
        echo "❌ $service Docker build failed"
        exit 1
    fi
    cd ../..
done

echo ""
echo "🎉 All checks passed! Your project is ready for Render deployment."
echo ""
echo "📝 Next steps:"
echo "1. Push your code to GitHub/GitLab:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push"
echo ""
echo "2. Go to [render.com](https://render.com) and sign up/login"
echo ""
echo "3. Create a new PostgreSQL database:"
echo "   - Name: autoinspect-db"
echo "   - Plan: Free"
echo ""
echo "4. Connect your Git repository and deploy services:"
echo "   - Use the render.yaml file for automatic deployment"
echo "   - Or follow the manual steps in RENDER_DEPLOYMENT_GUIDE.md"
echo ""
echo "5. Set environment variables for each service"
echo ""
echo "6. Test health endpoints after deployment:"
echo "   - Java services: /actuator/health"
echo "   - Chat service: /health"
echo "   - Frontend: Should load without CORS errors"
echo ""
echo "📚 For detailed instructions, see: RENDER_DEPLOYMENT_GUIDE.md"
echo ""
echo "🔗 Useful Render documentation:"
echo "   - [Getting Started](https://render.com/docs/getting-started)"
echo "   - [Web Services](https://render.com/docs/web-services)"
echo "   - [PostgreSQL](https://render.com/docs/databases)"
echo "   - [Static Sites](https://render.com/docs/static-sites)"
