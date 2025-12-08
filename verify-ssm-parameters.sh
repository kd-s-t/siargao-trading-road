#!/bin/bash

SSM_PATH="/siargaotradingroad/development"
AWS_REGION="us-east-1"

echo "Verifying SSM Parameters for Production"
echo "======================================="
echo "SSM Path: $SSM_PATH"
echo "Region: $AWS_REGION"
echo ""

REQUIRED_PARAMS=(
  "S3_BUCKET"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_REGION"
  "DB_HOST"
  "DB_PORT"
  "DB_USER"
  "DB_PASSWORD"
  "DB_NAME"
  "JWT_SECRET"
  "PORT"
)

OPTIONAL_PARAMS=(
  "PORT"
  "AWS_REGION"
)

echo "Fetching all parameters from SSM..."
ALL_PARAMS=$(aws ssm get-parameters-by-path \
  --path "$SSM_PATH" \
  --recursive \
  --region "$AWS_REGION" \
  --with-decryption \
  --query 'Parameters[*].[Name,Value]' \
  --output text 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "❌ Failed to fetch parameters from SSM"
  echo "Make sure AWS CLI is configured and you have permissions"
  exit 1
fi

echo ""
echo "Checking required parameters..."
echo ""

MISSING_PARAMS=()
FOUND_PARAMS=()

for param in "${REQUIRED_PARAMS[@]}"; do
  PARAM_NAME="$SSM_PATH/$param"
  VALUE=$(echo "$ALL_PARAMS" | grep "$PARAM_NAME" | awk '{print $2}')
  
  if [ -z "$VALUE" ]; then
    echo "❌ Missing: $param"
    MISSING_PARAMS+=("$param")
  else
    if [ "$param" == "AWS_SECRET_ACCESS_KEY" ] || [ "$param" == "DB_PASSWORD" ] || [ "$param" == "JWT_SECRET" ]; then
      MASKED_VALUE="${VALUE:0:4}****${VALUE: -4}"
      echo "✅ Found: $param = $MASKED_VALUE"
    else
      echo "✅ Found: $param = $VALUE"
    fi
    FOUND_PARAMS+=("$param")
  fi
done

echo ""
echo "Summary:"
echo "========="
echo "Found: ${#FOUND_PARAMS[@]} parameters"
echo "Missing: ${#MISSING_PARAMS[@]} parameters"

if [ ${#MISSING_PARAMS[@]} -gt 0 ]; then
  echo ""
  echo "❌ Missing parameters:"
  for param in "${MISSING_PARAMS[@]}"; do
    echo "  - $param"
  done
  echo ""
  echo "To add missing parameters, use:"
  echo ""
  for param in "${MISSING_PARAMS[@]}"; do
    case $param in
      "S3_BUCKET")
        echo "aws ssm put-parameter \\"
        echo "  --name \"$SSM_PATH/S3_BUCKET\" \\"
        echo "  --value \"siargaotradingroad-user-uploads-development\" \\"
        echo "  --type \"String\" \\"
        echo "  --region \"$AWS_REGION\" \\"
        echo "  --overwrite"
        ;;
      "AWS_ACCESS_KEY_ID")
        echo "aws ssm put-parameter \\"
        echo "  --name \"$SSM_PATH/AWS_ACCESS_KEY_ID\" \\"
        echo "  --value \"YOUR_ACCESS_KEY\" \\"
        echo "  --type \"SecureString\" \\"
        echo "  --region \"$AWS_REGION\" \\"
        echo "  --overwrite"
        ;;
      "AWS_SECRET_ACCESS_KEY")
        echo "aws ssm put-parameter \\"
        echo "  --name \"$SSM_PATH/AWS_SECRET_ACCESS_KEY\" \\"
        echo "  --value \"YOUR_SECRET_KEY\" \\"
        echo "  --type \"SecureString\" \\"
        echo "  --region \"$AWS_REGION\" \\"
        echo "  --overwrite"
        ;;
      "AWS_REGION")
        echo "aws ssm put-parameter \\"
        echo "  --name \"$SSM_PATH/AWS_REGION\" \\"
        echo "  --value \"us-east-1\" \\"
        echo "  --type \"String\" \\"
        echo "  --region \"$AWS_REGION\" \\"
        echo "  --overwrite"
        ;;
      *)
        echo "aws ssm put-parameter \\"
        echo "  --name \"$SSM_PATH/$param\" \\"
        echo "  --value \"YOUR_VALUE\" \\"
        echo "  --type \"SecureString\" \\"
        echo "  --region \"$AWS_REGION\" \\"
        echo "  --overwrite"
        ;;
    esac
    echo ""
  done
  exit 1
else
  echo ""
  echo "✅ All required parameters are set!"
  echo ""
  echo "After adding any missing parameters, restart the API container:"
  echo "  ssh ubuntu@34.204.178.33 \"cd ~/siargao-trading-road && docker compose restart api\""
fi
