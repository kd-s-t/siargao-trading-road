# Nginx SSL Proxy Configuration Fix

**Date:** December 12, 2025  
**Environment:** Production  
**Instance:** EC2 (3.237.15.10)

## Problem

The website `https://siargaotradingroad.com/` was unreachable or returning incorrect content:

- HTTPS was accessible but serving the default nginx welcome page (612 bytes) instead of the application
- Docker containers were running correctly (`siargao-frontend` and `siargao-api`)
- Containers responded correctly when tested directly on ports 3021 and 3020
- SSL certificates were properly generated and configured

## Root Cause

Two issues were identified:

### 1. Missing Proxy Timeout Settings in Terraform

The Terraform EC2 module (`infrastructure/terraform/modules/ec2/main.tf`) was creating the nginx configuration but was missing critical proxy timeout settings:

- Missing `proxy_connect_timeout 300s`
- Missing `proxy_send_timeout 300s`
- Missing `proxy_read_timeout 300s`
- Missing `proxy_buffering off`

These settings are essential to prevent "upstream prematurely closed connection" errors when nginx proxies requests to the Docker containers.

### 2. Certbot Modified Wrong Nginx Config

When Terraform ran `certbot --nginx` to generate SSL certificates, Certbot modified the default nginx configuration file (`/etc/nginx/sites-available/default`) instead of the `ssl-domains` configuration file that Terraform created. This caused:

- The `ssl-domains` config to be ignored
- The default config to serve static files instead of proxying to containers
- SSL certificates to be applied to the wrong server block

## Solution

### Step 1: Updated Terraform Configuration

Updated `infrastructure/terraform/modules/ec2/main.tf` to include proxy timeout settings in both `/api` and `/` location blocks:

```terraform
location /api {
    proxy_pass http://localhost:3020/api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 300s;      # Added
    proxy_send_timeout 300s;         # Added
    proxy_read_timeout 300s;         # Added
    proxy_buffering off;              # Added
}

location / {
    proxy_pass http://localhost:3021;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_connect_timeout 300s;      # Added
    proxy_send_timeout 300s;         # Added
    proxy_read_timeout 300s;         # Added
    proxy_buffering off;              # Added
}
```

Also added `client_max_body_size 100M;` to the server block.

### Step 2: Fixed Current Instance Configuration

Since the production SSH key was not available locally, the fix was applied via AWS Systems Manager (SSM):

1. **Removed the default nginx config:**
   ```bash
   sudo rm -f /etc/nginx/sites-enabled/default
   ```

2. **Created the correct ssl-domains configuration** with:
   - SSL server block (port 443) with proper proxy settings
   - HTTP redirect server block (port 80)
   - All proxy timeout settings included
   - Proper proxy headers for WebSocket support

3. **Enabled the configuration:**
   ```bash
   sudo ln -sf /etc/nginx/sites-available/ssl-domains /etc/nginx/sites-enabled/ssl-domains
   sudo nginx -t
   sudo systemctl reload nginx
   ```

The complete nginx configuration that was deployed:

```nginx
server {
    listen 443 ssl http2;
    server_name siargaotradingroad.com www.siargaotradingroad.com;
    
    ssl_certificate /etc/letsencrypt/live/siargaotradingroad.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/siargaotradingroad.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    client_max_body_size 100M;
    
    location /api {
        proxy_pass http://127.0.0.1:3020/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_buffering off;
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
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_buffering off;
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
```

## Verification

After applying the fix:

```bash
curl -I https://siargaotradingroad.com/
```

**Expected response:**
```
HTTP/2 200 
server: nginx/1.18.0 (Ubuntu)
content-type: text/html; charset=utf-8
x-powered-by: Next.js
```

The site should now:
- Serve the Next.js frontend application (not the default nginx page)
- Proxy API requests correctly to the Go backend
- Support WebSocket connections for real-time features
- Handle long-running requests without timing out

## Prevention

### For Future Terraform Deployments

The Terraform configuration has been updated to include all necessary proxy timeout settings. When deploying new infrastructure, these settings will be automatically included.

### For Manual Configuration

When manually configuring nginx for SSL proxying:

1. **Always include proxy timeout settings:**
   - `proxy_connect_timeout 300s`
   - `proxy_send_timeout 300s`
   - `proxy_read_timeout 300s`
   - `proxy_buffering off`

2. **Use `127.0.0.1` instead of `localhost`** in proxy_pass directives (more reliable)

3. **Disable the default nginx config** before enabling custom configs:
   ```bash
   sudo rm -f /etc/nginx/sites-enabled/default
   ```

4. **Test nginx configuration** before reloading:
   ```bash
   sudo nginx -t
   ```

5. **If using Certbot**, be aware that it may modify the config file. After running Certbot:
   - Verify the configuration still has all proxy settings
   - Check that it's using the correct server block
   - Re-apply proxy timeout settings if they were removed

## Related Files

- `infrastructure/terraform/modules/ec2/main.tf` - Terraform EC2 module with nginx configuration
- `scripts/fix-502.sh` - Script for fixing nginx proxy issues (can be used for reference)
- `/etc/nginx/sites-available/ssl-domains` - Production nginx configuration file on EC2

## Notes

- The fix was applied via AWS SSM because the production SSH key was not available locally
- The base64 encoding method was used to transfer the nginx configuration via SSM to avoid heredoc escaping issues
- Future deployments via Terraform will automatically include the correct configuration

