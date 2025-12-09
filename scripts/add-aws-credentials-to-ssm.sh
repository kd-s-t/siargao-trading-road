#!/bin/bash

SSM_PATH="${SSM_PATH:-/siargaotradingroad/development}"
AWS_REGION="${AWS_REGION:-us-east-1}"

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Error: AWS credentials must be provided via environment variables"
  echo ""
  echo "Usage:"
  echo "  AWS_ACCESS_KEY_ID=your_key AWS_SECRET_ACCESS_KEY=your_secret ./scripts/add-aws-credentials-to-ssm.sh"
  echo ""
  echo "Or export them first:"
  echo "  export AWS_ACCESS_KEY_ID=your_key"
  echo "  export AWS_SECRET_ACCESS_KEY=your_secret"
  echo "  ./scripts/add-aws-credentials-to-ssm.sh"
  exit 1
fi

echo "Adding AWS Credentials to SSM Parameter Store"
echo "=============================================="
echo "SSM Path: $SSM_PATH"
echo "Region: $AWS_REGION"
echo ""

echo "Adding AWS_ACCESS_KEY_ID..."
aws ssm put-parameter \
  --name "$SSM_PATH/AWS_ACCESS_KEY_ID" \
  --value "$AWS_ACCESS_KEY_ID" \
  --type "SecureString" \
  --region "$AWS_REGION" \
  --overwrite

if [ $? -eq 0 ]; then
  echo "✅ AWS_ACCESS_KEY_ID added successfully"
else
  echo "❌ Failed to add AWS_ACCESS_KEY_ID"
  exit 1
fi

echo ""
echo "Adding AWS_SECRET_ACCESS_KEY..."
aws ssm put-parameter \
  --name "$SSM_PATH/AWS_SECRET_ACCESS_KEY" \
  --value "$AWS_SECRET_ACCESS_KEY" \
  --type "SecureString" \
  --region "$AWS_REGION" \
  --overwrite

if [ $? -eq 0 ]; then
  echo "✅ AWS_SECRET_ACCESS_KEY added successfully"
else
  echo "❌ Failed to add AWS_SECRET_ACCESS_KEY"
  exit 1
fi

echo ""
echo "✅ All AWS credentials added to SSM!"
echo ""
echo "Next step: Restart the API container on EC2:"
echo "  ssh ubuntu@34.204.178.33 \"cd ~/siargao-trading-road && docker compose restart api\""
