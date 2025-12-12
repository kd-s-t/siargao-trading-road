#!/bin/bash

SSH_KEY="infrastructure/terraform/modules/security/siargaotradingroad-key-production.pem"
SERVER="ubuntu@3.237.15.10"

echo "Checking server status..."
echo ""

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_SCRIPT'
set -e

echo "=== Docker Container Status ==="
cd ~/siargao-trading-road 2>/dev/null || echo "Project directory not found"
docker compose ps 2>/dev/null || docker ps --filter "name=siargao" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l | head -10 || echo "Nginx status check failed"

echo ""
echo "=== Nginx Configuration Test ==="
sudo nginx -t 2>&1 || echo "Nginx config test failed"

echo ""
echo "=== Port Accessibility ==="
echo "Checking port 3020 (API):"
timeout 2 curl -s http://127.0.0.1:3020/api/health 2>&1 | head -3 || echo "✗ Port 3020 not responding"

echo ""
echo "Checking port 3021 (Frontend):"
timeout 2 curl -s -I http://127.0.0.1:3021/ 2>&1 | head -3 || echo "✗ Port 3021 not responding"

echo ""
echo "=== Nginx Error Logs (last 10 lines) ==="
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "Cannot read nginx error log"

echo ""
echo "=== Container Logs (last 5 lines each) ==="
echo "Frontend logs:"
docker logs siargao-frontend --tail 5 2>&1 || echo "Cannot read frontend logs"

echo ""
echo "API logs:"
docker logs siargao-api --tail 5 2>&1 || echo "Cannot read API logs"

echo ""
echo "=== Disk Space ==="
df -h / | tail -1

echo ""
echo "=== Docker System Info ==="
docker system df 2>/dev/null || echo "Docker system info unavailable"
REMOTE_SCRIPT

echo ""
echo "=== Testing External Access ==="
echo "Testing HTTPS:"
curl -I --max-time 10 https://siargaotradingroad.com/ 2>&1 | head -5 || echo "HTTPS test failed"

echo ""
echo "Testing API:"
curl -I --max-time 10 https://siargaotradingroad.com/api/health 2>&1 | head -5 || echo "API test failed"
