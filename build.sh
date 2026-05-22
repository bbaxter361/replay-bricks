#!/bin/bash
set -e

echo "=== Building website ==="
cd website
npm ci
npm run build
echo "Website build complete."

echo "=== Building hold app ==="
cd ../hold
npm install
npm run build
echo "Hold build complete."

echo "=== Copying hold to website dist ==="
cp -r dist ../website/dist/hold
echo "Deploy ready."
