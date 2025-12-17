#!/bin/bash

set -e

REPO_NAME="siargaotradingroad-development-api"
REGION="us-east-1"

echo "Checking ECR repository: $REPO_NAME"
echo ""

echo "=== Repository Info ==="
aws ecr describe-repositories --repository-names "$REPO_NAME" --region "$REGION" 2>/dev/null || {
  echo "Repository does not exist!"
  exit 1
}

echo ""
echo "=== All Images in Repository ==="
aws ecr describe-images \
  --repository-name "$REPO_NAME" \
  --region "$REGION" \
  --query 'sort_by(imageDetails,&imagePushedAt)[*].[imageTags[0],imagePushedAt]' \
  --output table 2>/dev/null || echo "No images found or error listing images"

echo ""
echo "=== Latest 5 Images with Tags ==="
aws ecr describe-images \
  --repository-name "$REPO_NAME" \
  --region "$REGION" \
  --query 'sort_by(imageDetails,&imagePushedAt)[-5:].[imageTags[0],imagePushedAt]' \
  --output table 2>/dev/null || echo "No images found"

echo ""
echo "=== Image Count ==="
IMAGE_COUNT=$(aws ecr describe-images \
  --repository-name "$REPO_NAME" \
  --region "$REGION" \
  --query 'length(imageDetails)' \
  --output text 2>/dev/null || echo "0")
echo "Total images: $IMAGE_COUNT"
