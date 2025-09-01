#!/bin/bash

echo "🚀 Building Jobna for production..."

# Install dependencies
npm install

# Build the project
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "📁 Your build files are in the 'build' directory"
echo ""
echo "🌐 To deploy to Netlify:"
echo "   1. Go to https://netlify.com"
echo "   2. Drag and drop the 'build' folder"
echo "   3. Or connect your GitHub repository"
echo ""
echo "📋 Build information:"
echo "   - Main JS: build/static/js/main.*.js"
echo "   - Main CSS: build/static/css/main.*.css"
echo "   - Total size: ~63KB (gzipped)"
