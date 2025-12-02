#!/bin/bash

# Script to set up GitHub repository description, website, and topics
REPO_OWNER="kd-s-t"
REPO_NAME="siargao-trading-road"
DESCRIPTION="Marketplace app connecting suppliers and stores in Siargao. Built with Next.js, Go, and React Native."
WEBSITE="http://98.92.33.58:3021"
TOPICS=("marketplace" "nextjs" "golang" "react-native" "typescript" "postgresql" "docker" "aws" "siargao" "e-commerce" "trading" "supplier-management" "expo" "terraform" "rest-api" "jwt" "material-ui")

echo "🚀 Setting up GitHub repository information..."
echo ""
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo "Description: $DESCRIPTION"
echo "Website: $WEBSITE"
echo "Topics: ${TOPICS[*]}"
echo ""

if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) is not installed."
  echo ""
  echo "Install it with: brew install gh"
  echo ""
  echo "Or set these manually in GitHub:"
  echo "  1. Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings"
  echo "  2. Scroll to 'About' section"
  echo "  3. Add description: $DESCRIPTION"
  echo "  4. Add website: $WEBSITE"
  echo "  5. Add topics: ${TOPICS[*]}"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "❌ Not logged in to GitHub CLI."
  echo "Run: gh auth login"
  exit 1
fi

echo "📝 Setting repository description..."
gh repo edit "$REPO_OWNER/$REPO_NAME" --description "$DESCRIPTION"

echo "🌐 Note: Website URL must be set manually in GitHub UI:"
echo "   Go to: https://github.com/$REPO_OWNER/$REPO_NAME/settings"
echo "   Website: $WEBSITE"
echo ""

echo "🏷️  Setting repository topics..."
TOPICS_STRING=$(IFS=','; echo "${TOPICS[*]}")
gh repo edit "$REPO_OWNER/$REPO_NAME" --add-topic "$TOPICS_STRING"

echo ""
echo "✅ Repository information updated!"
echo ""
echo "⚠️  Don't forget to manually set the website URL:"
echo "   https://github.com/$REPO_OWNER/$REPO_NAME/settings"
