# Siargao Trading Road - Golang Infrastructure

This Terraform configuration deploys the complete infrastructure for the Siargao Trading Road Golang backend application.

## Architecture

- **EC2**: Ubuntu instance running the Golang API in Docker
- **ECR**: Docker image repository for the Golang application
- **RDS**: PostgreSQL database for the application
- **S3**: Bucket for user uploads (images, documents)
- **Security Groups**: Network security for EC2 and RDS
- **IAM Roles**: Permissions for EC2 to access ECR and S3
- **SSM Parameters**: Secure storage for configuration (DB credentials, JWT secrets, etc.)

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0 installed
3. SSH key pair for EC2 access
4. AWS account with permissions to create:
   - EC2 instances
   - RDS databases
   - S3 buckets
   - ECR repositories
   - IAM roles and policies
   - Security groups
   - SSM parameters

## Quick Start

1. Copy the example variables file:
```bash
cp siargao-golang.tfvars.example siargao-golang.tfvars
```

2. Edit `siargao-golang.tfvars` with your values:
   - Set `public_key_path` and `private_key_path` to your SSH keys
   - Set `aws_region` to your preferred region
   - Configure database settings
   - Set `environment` (production, staging, development)

3. Initialize Terraform:
```bash
terraform init
```

4. Review the plan:
```bash
terraform plan -var-file="siargao-golang.tfvars"
```

5. Apply the configuration:
```bash
terraform apply -var-file="siargao-golang.tfvars"
```

## Variables

### Required Variables

- `public_key_path`: Path to your public SSH key
- `private_key_path`: Path to your private SSH key

### Optional Variables (with defaults)

- `aws_region`: AWS region (default: "us-east-1")
- `environment`: Environment name (default: "production")
- `instance_type`: EC2 instance type (default: "t3.micro")
- `db_name`: Database name (default: "siargaotradingroad")
- `db_username`: Database username (default: "siargaotradingroad_admin")
- `db_password`: Database password (empty = auto-generated)
- `rds_instance_class`: RDS instance class (default: "db.t3.micro")
- `rds_allocated_storage`: Initial storage in GB (default: 20)
- `rds_max_allocated_storage`: Max storage for autoscaling (default: 100)
- `rds_engine_version`: PostgreSQL version (default: "15.4")
- `upload_retention_days`: S3 upload retention (default: 365)

## Outputs

After deployment, Terraform will output:

- `ec2_instance_id`: EC2 instance ID
- `ec2_public_ip`: Public IP address
- `ec2_ssh_command`: SSH command to connect
- `ecr_api_repository_url`: ECR repository URL for Docker images
- `rds_endpoint`: RDS database endpoint
- `rds_port`: RDS database port
- `s3_uploads_bucket_name`: S3 bucket name for uploads
- `s3_uploads_bucket_arn`: S3 bucket ARN

## Deploying the Golang Application

1. Build and push Docker image to ECR:
```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <ecr-repo-url>
docker build -f golang.Dockerfile -t <ecr-repo-url>:latest .
docker push <ecr-repo-url>:latest
```

2. SSH into EC2 instance:
```bash
terraform output -raw ec2_ssh_command
```

3. Pull and run the container:
```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <ecr-repo-url>
docker pull <ecr-repo-url>:latest
docker run -d \
  --name siargao-api \
  -p 3020:3020 \
  --env-file <(aws ssm get-parameters-by-path --path "/siargaotradingroad/production/" --with-decryption --query 'Parameters[*].[Name,Value]' --output text | sed 's/\t/=/') \
  <ecr-repo-url>:latest
```

## Environment Variables

The application reads configuration from AWS SSM Parameter Store. The following parameters are created:

- `/siargaotradingroad/{environment}/DB_HOST`
- `/siargaotradingroad/{environment}/DB_PORT`
- `/siargaotradingroad/{environment}/DB_USER`
- `/siargaotradingroad/{environment}/DB_PASSWORD`
- `/siargaotradingroad/{environment}/DB_NAME`
- `/siargaotradingroad/{environment}/JWT_SECRET`
- `/siargaotradingroad/{environment}/S3_BUCKET`
- `/siargaotradingroad/{environment}/AWS_REGION`
- `/siargaotradingroad/{environment}/AWS_ACCESS_KEY_ID` (optional)
- `/siargaotradingroad/{environment}/AWS_SECRET_ACCESS_KEY` (optional)

## Database Access

The RDS instance is only accessible from the EC2 security group by default. To access from your local machine:

1. Add your IP to `rds_allowed_cidr_blocks` in `siargao-golang.tfvars`
2. Run `terraform apply` to update security groups
3. Connect using the endpoint from `terraform output rds_endpoint`

## SSL/HTTPS Setup

To enable SSL certificates with Let's Encrypt:

1. Set `enable_ssl = true` in `siargao-golang.tfvars`
2. Set `ssl_domains = ["yourdomain.com", "www.yourdomain.com"]`
3. Set `ssl_email = "your-email@example.com"`
4. Run `terraform apply`

## Cost Estimation

Approximate monthly costs (us-east-1):

- EC2 t3.micro: ~$7-10
- RDS db.t3.micro: ~$15-20
- S3 storage (10GB): ~$0.23
- ECR storage (5GB): ~$0.50
- Data transfer: Variable

Total: ~$25-35/month (excluding data transfer)

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file="siargao-golang.tfvars"
```

**Warning**: This will delete the RDS database and all data unless `rds_skip_final_snapshot = false` (default).

## Troubleshooting

### EC2 instance not accessible
- Check security group rules
- Verify SSH key is correct
- Check EC2 instance status in AWS Console

### Database connection issues
- Verify RDS security group allows EC2 security group
- Check SSM parameters are set correctly
- Verify database credentials

### Docker image pull fails
- Verify EC2 IAM role has ECR permissions
- Check ECR repository policy
- Ensure Docker is installed on EC2

## Next Steps

1. Set up CI/CD pipeline to automatically build and deploy Docker images
2. Configure CloudWatch monitoring and alerts
3. Set up automated backups for RDS
4. Configure CloudFront for S3 bucket (if needed)
5. Set up Route53 for custom domain

