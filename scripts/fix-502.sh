#!/bin/bash

SSH_KEY="infrastructure/terraform/modules/security/siargaotradingroad-key-development.pem"
SERVER="ubuntu@34.204.178.33"

echo "Fixing 502 Bad Gateway issue..."

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_SCRIPT'
set -e

echo "Updating nginx configuration..."

sudo tee /etc/nginx/sites-available/ssl-domains > /dev/null << 'NGINX_CONFIG'
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
NGINX_CONFIG

echo "Testing nginx configuration..."
sudo nginx -t

echo "Reloading nginx..."
sudo systemctl reload nginx

echo "Restarting frontend container..."
cd ~/siargao-trading-road
docker compose restart frontend

echo "Waiting for container to be ready..."
sleep 10

echo "Checking container status..."
docker ps --filter name=siargao-frontend --format "{{.Names}}: {{.Status}}"

echo "Testing local connection..."
timeout 5 curl -s http://127.0.0.1:3021/ > /dev/null && echo "✓ Frontend responds locally" || echo "✗ Frontend not responding"

echo "Done!"
REMOTE_SCRIPT

echo ""
echo "Testing HTTPS..."
sleep 3
curl -I --max-time 10 https://siargaotradingroad.com/ 2>&1 | head -5

