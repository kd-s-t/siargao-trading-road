# EC2 Server Setup Guide

## SSH to Server

```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-host
```

Or if using SSH key from secrets:
```bash
ssh ubuntu@your-ec2-host
```

## Install Docker

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index again
sudo apt-get update

# Install Docker
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
```

**Note:** After adding user to docker group, you may need to log out and back in, or run:
```bash
newgrp docker
```

## Install AWS CLI

```bash
# Download AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"

# Install unzip if not already installed
sudo apt-get install -y unzip

# Unzip and install
unzip awscliv2.zip
sudo ./aws/install

# Clean up
rm -rf aws awscliv2.zip

# Verify installation
aws --version
```

## Configure AWS Credentials

```bash
# Configure AWS credentials (you'll need your access key and secret)
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

## Verify Everything Works

```bash
# Check Docker
docker --version
docker ps

# Check AWS CLI
aws --version
aws ecr describe-repositories --region us-east-1
```

