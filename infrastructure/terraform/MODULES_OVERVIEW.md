# Terraform Modules Overview - Siargao Trading Road

This document explains what each Terraform module does in the infrastructure.

## Architecture Overview

The infrastructure deploys a complete backend stack for Siargao Trading Road:
- **EC2**: Ubuntu server running Golang API and Next.js frontend (via Docker)
- **RDS**: PostgreSQL database
- **ECR**: Docker image repositories
- **S3**: File storage buckets
- **Security**: Security groups, SSH keys, IAM roles
- **SSM**: Secure parameter storage for configuration

---

## Module: `security`

**Purpose**: Creates security infrastructure for EC2 access

**Resources Created**:
- **SSH Key Pair**: Generates ED25519 key pair for EC2 SSH access
  - Saves private key locally as `.pem` file
  - Creates AWS key pair resource
- **Security Group**: EC2 security group with rules for:
  - SSH (port 22)
  - HTTP (port 80)
  - HTTPS (port 443)
  - Next.js app (port 3021)
  - Golang API (port 3020)
  - All outbound traffic

**Outputs**:
- `key_pair_name`: SSH key pair name
- `private_key_content`: Private key for SSH access
- `security_group_id`: Security group ID for EC2

---

## Module: `iam`

**Purpose**: Creates IAM roles and policies for EC2 instance

**Resources Created**:
- **IAM Role**: EC2 instance role with permissions for:
  - ECR access (pull Docker images)
  - SSM Parameter Store access (read/write config)
- **IAM Instance Profile**: Attaches role to EC2 instances
- **Managed Policy**: Attaches `AmazonSSMManagedInstanceCore` for Systems Manager access

**Outputs**:
- `ec2_role_arn`: ARN of the EC2 IAM role
- `ec2_instance_profile_name`: Instance profile name

---

## Module: `ec2`

**Purpose**: Creates and configures EC2 instance for application hosting

**Resources Created**:
- **EC2 Instance**: Ubuntu server (t3.micro by default)
  - 30GB encrypted root volume (gp3)
  - Attached security group
  - IAM instance profile for permissions
- **Elastic IP** (optional): Static IP address
- **Remote Provisioning**: Automatically installs:
  - Docker & Docker Compose
  - Nginx (reverse proxy)
  - AWS CLI
  - Node.js
  - SSL certificates (Let's Encrypt, if enabled)

**Configuration**:
- Nginx proxies:
  - `/` → Next.js (port 3021)
  - `/api` → Golang API (port 3020)
  - `/storybook/` → Storybook static files
  - `/health` → Health check endpoint

**Outputs**:
- `instance_id`: EC2 instance ID
- `public_ip`: Public IP address
- `ssh_command`: SSH command to connect

---

## Module: `rds`

**Purpose**: Creates PostgreSQL database for the application

**Resources Created**:
- **RDS Instance**: PostgreSQL database
  - Encrypted storage (gp3)
  - Automatic backups (configurable retention)
  - Performance Insights enabled
  - CloudWatch monitoring
- **DB Subnet Group**: Database subnet configuration
- **Security Group**: RDS security group
  - Allows PostgreSQL (5432) from EC2 security group
  - Optional: Allows specific CIDR blocks
- **IAM Role**: RDS monitoring role for enhanced monitoring

**Configuration**:
- Database name, username, password (auto-generated or provided)
- Storage autoscaling (up to max_allocated_storage)
- Publicly accessible (optional)
- Final snapshot on deletion (optional)

**Outputs**:
- `db_instance_address`: Database endpoint
- `db_instance_port`: Database port (5432)
- `db_instance_endpoint`: Full endpoint URL

---

## Module: `ecr`

**Purpose**: Creates Docker image repositories

**Resources Created**:
- **ECR Repository (Frontend)**: For Next.js Docker images
- **ECR Repository (API)**: For Golang API Docker images
- **Lifecycle Policies**: Automatic cleanup
  - Keeps last 30 tagged images
  - Deletes untagged images older than 1 day
- **Repository Policies**: Allows EC2 role to pull images
- **Image Scanning**: Automatic vulnerability scanning on push

**Outputs**:
- `frontend_repository_url`: Frontend ECR repository URL
- `api_repository_url`: API ECR repository URL

---

## Module: `s3-uploads`

**Purpose**: Creates S3 bucket for user file uploads

**Resources Created**:
- **S3 Bucket**: `siargaotradingroad-user-uploads-{environment}`
- **Versioning**: Enabled for file history
- **Public Access**: 
  - Public read access (anyone can download)
  - Public write access (anyone can upload)
- **CORS Configuration**: Allows cross-origin requests
- **Lifecycle Policy**: Auto-deletes files after 365 days (configurable)

**Use Case**: Product images, user uploads, documents

**Outputs**:
- `bucket_name`: S3 bucket name
- `bucket_arn`: Bucket ARN

---

## Module: `s3` (Mobile Builds)

**Purpose**: Creates S3 bucket for mobile app builds

**Resources Created**:
- **S3 Bucket**: `siargaotradingroad-mobile-builds-{environment}`
- **Versioning**: Enabled
- **Public Access**: Public read (for downloading APK/IPA files)
- **Website Configuration**: Static website hosting
- **CORS Configuration**: Allows downloads from web
- **Lifecycle Policy**: Auto-deletes builds after 90 days (configurable)
- **Ownership Controls**: BucketOwnerEnforced

**Use Case**: Android APK and iOS IPA file distribution

**Outputs**:
- `bucket_name`: S3 bucket name
- `public_url`: Public URL for accessing builds

---

## Module: `s3-messaging-images`

**Purpose**: Creates S3 bucket for messaging/chat images

**Resources Created**:
- **S3 Bucket**: `siargaotradingroad-messaging-images-{environment}`
- **Versioning**: Enabled
- **Public Access**: 
  - Public read (anyone can view images)
  - Write access only for EC2 role
- **CORS Configuration**: Allows image uploads from web
- **Lifecycle Policy**: Auto-deletes images after 365 days (configurable)
- **Ownership Controls**: BucketOwnerPreferred

**Use Case**: Chat/messaging image attachments

**Note**: Only created for `development` and `production` environments

**Outputs**:
- `bucket_name`: S3 bucket name
- `bucket_arn`: Bucket ARN

---

## Module: `ssm`

**Purpose**: Stores application configuration securely in AWS Systems Manager Parameter Store

**Resources Created**:
- **SSM Parameters** (all under `/siargaotradingroad/{environment}/`):
  - `S3_BUCKET`: S3 bucket name for uploads
  - `AWS_ACCESS_KEY_ID`: AWS access key (SecureString)
  - `AWS_SECRET_ACCESS_KEY`: AWS secret key (SecureString)
  - `AWS_REGION`: AWS region (us-east-1)
  - `JWT_SECRET`: JWT signing secret (SecureString, auto-generated)
  - `DB_HOST`: Database hostname
  - `DB_PORT`: Database port (5432)
  - `DB_USER`: Database username
  - `DB_PASSWORD`: Database password (SecureString, auto-generated)
  - `DB_NAME`: Database name

**Use Case**: 
- EC2 instances read these parameters at runtime
- No need to hardcode secrets in code
- Secure storage with encryption

**Outputs**: None (parameters are accessed by path)

---

## Resource Dependencies

```
security (SSH keys, security groups)
    ↓
iam (IAM roles)
    ↓
ec2 (EC2 instance) ──→ Uses: security, iam
rds (Database) ───────→ Uses: security (for security group)
ecr (Docker repos) ───→ Uses: iam (for pull permissions)
s3-uploads ────────────→ Uses: iam (for EC2 write access)
s3-messaging-images ──→ Uses: iam (for EC2 write access)
ssm (Config) ─────────→ Uses: rds, s3-uploads (for values)
```

---

## Environment Variables

The infrastructure supports multiple environments:
- `development`
- `production`
- Other custom environments

Each environment gets its own:
- EC2 instance
- RDS database
- ECR repositories
- S3 buckets
- Security groups
- IAM roles

---

## Cost Estimate (per environment)

- **EC2 t3.micro**: ~$7-10/month
- **RDS db.t3.micro**: ~$15-20/month
- **S3 Storage**: ~$0.023/GB/month
- **ECR Storage**: ~$0.10/GB/month
- **Data Transfer**: Variable

**Total per environment**: ~$25-35/month (excluding data transfer)

---

## Security Features

1. **Encryption**: 
   - RDS storage encrypted
   - EC2 root volume encrypted
   - SSM parameters encrypted (SecureString)

2. **Access Control**:
   - Security groups restrict network access
   - IAM roles follow least privilege
   - SSH key-based authentication

3. **Secrets Management**:
   - Passwords auto-generated
   - Stored in SSM Parameter Store
   - Never exposed in code or logs

4. **Network Security**:
   - RDS only accessible from EC2 security group
   - Optional: Allow specific IPs for direct DB access

---

## Deployment Flow

1. **Terraform Apply** creates all infrastructure
2. **EC2 Provisioning** installs Docker, Nginx, etc.
3. **Build & Push** Docker images to ECR
4. **Deploy** containers on EC2
5. **Application** reads config from SSM Parameter Store
6. **Nginx** routes traffic to containers

---

## Notes

- EC2 instances are configured for both Next.js (port 3021) and Golang API (port 3020)
- Next.js is also deployed on Vercel (separate from this infrastructure)
- S3 buckets have public read access for easy file sharing
- RDS databases can be made publicly accessible for direct connections
- All resources are tagged with `Project: SiargaoTradingRoad` and `Environment: {env}`

