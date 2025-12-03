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

## EC2 Instance Protection

The EC2 instance is configured with deletion protection to prevent accidental termination:

- **AWS Termination Protection**: `disable_api_termination = true` - Prevents termination via AWS API/Console/CLI
- **Terraform Lifecycle Protection**: `prevent_destroy = true` - Prevents Terraform from destroying the instance

If you need to destroy the instance, you must:
1. Temporarily remove `prevent_destroy = true` from the Terraform configuration
2. Set `disable_api_termination = false` on the instance
3. Then run `terraform destroy`

## Troubleshooting

### 502 Bad Gateway on HTTPS

**Problem:**
- HTTPS requests to the domain return `502 Bad Gateway`
- HTTP requests via IP address work fine
- Nginx error logs show: `upstream prematurely closed connection while reading response header from upstream`
- Frontend container responds correctly when tested directly

**Root Cause:**
- Corrupted nginx configuration file with:
  - Duplicate `proxy_http_version` directives
  - Invalid upstream reference (`frontend_backend` that doesn't exist)
  - Multiple conflicting `Connection` header settings
  - Broken directives from previous configuration attempts

**Solution:**

1. **SSH into the server:**
   ```bash
   ssh -i infrastructure/terraform/modules/security/splitsafe-key-development.pem ubuntu@34.204.178.33
   ```

2. **Remove the corrupted config and create a clean one:**
   ```bash
   sudo rm -f /etc/nginx/sites-enabled/ssl-domains
   sudo tee /etc/nginx/sites-available/ssl-domains > /dev/null << 'NGINX_CONFIG'
   server {
       listen 443 ssl http2;
       server_name siargaotradingroad.com www.siargaotradingroad.com;
       
       ssl_certificate /etc/letsencrypt/live/siargaotradingroad.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/siargaotradingroad.com/privkey.pem;
       include /etc/letsencrypt/options-ssl-nginx.conf;
       ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
       
       location /api {
           proxy_pass http://127.0.0.1:3020/api;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       location / {
           proxy_pass http://127.0.0.1:3021;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /health {
           access_log off;
           return 200 "healthy\n";
           add_header Content-Type text/plain;
       }
   }
   
   server {
       listen 80;
       server_name siargaotradingroad.com www.siargaotradingroad.com;
       return 301 https://$host$request_uri;
   }
   NGINX_CONFIG
   
   sudo ln -sf /etc/nginx/sites-available/ssl-domains /etc/nginx/sites-enabled/ssl-domains
   ```

3. **Test and reload nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Verify it works:**
   ```bash
   curl -I https://siargaotradingroad.com/
   ```

**Key Points:**
- Always use `127.0.0.1` instead of `localhost` in proxy_pass directives
- Avoid duplicate directives in nginx config
- Test nginx config with `sudo nginx -t` before reloading
- Keep the configuration simple and clean

**Prevention:**
- When modifying nginx config, always test with `sudo nginx -t` first
- Keep a backup of working configurations
- Avoid making multiple rapid changes that can corrupt the config

