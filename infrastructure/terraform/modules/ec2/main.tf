locals {
  ubuntu_ami_id = "ami-0c7217cdde317cfec"
}

resource "aws_eip" "siargaotradingroad_eip" {
  instance = aws_instance.siargaotradingroad_server.id
  domain   = "vpc"
  
  tags = {
    Name = "siargaotradingroad-eip-${var.environment}"
    Project = "SiargaoTradingRoad"
    Environment = var.environment
  }
}

resource "aws_instance" "siargaotradingroad_server" {
  ami                    = local.ubuntu_ami_id
  instance_type          = var.instance_type
  key_name              = var.key_pair_name
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = var.instance_profile_name

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  tags = {
    Name = "siargao-trading-road-server-${var.environment}"
    Project = "SiargaoTradingRoad"
    Environment = var.environment
  }

  provisioner "remote-exec" {
    on_failure = fail

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = var.private_key_content
      host        = self.public_ip
      timeout     = "30m"
    }

    inline = [
      "echo '======================================================================================'",
      "echo 'Siargao Trading Road EC2 Instance Setup (Ubuntu)'",
      "echo '======================================================================================'",
      "echo 'Disabling automatic updates to speed up provisioning...'",
      "sudo systemctl disable unattended-upgrades",
      "sudo systemctl stop unattended-upgrades",
      "echo 'Updating OS and installing basic dependencies...'",
      "sudo apt update -qq",
      "sudo apt install -y curl wget",
      "echo 'Basic packages installed'",
      "echo '======================================================================================'",
      "echo 'Installing Docker...'",
      "sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release",
      "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg",
      "echo \"deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null",
      "sudo apt update -qq",
      "sudo apt install -y docker-ce docker-ce-cli containerd.io || exit 1",
      "sudo systemctl start docker",
      "sudo systemctl enable docker",
      "sudo systemctl status docker --no-pager || exit 1",
      "sudo usermod -aG docker ubuntu",
      "echo 'Docker installed and configured'",
      "echo '======================================================================================'",
      "echo 'Installing Docker Compose...'",
      "mkdir -p ~/.docker/cli-plugins/",
      "curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose",
      "chmod +x ~/.docker/cli-plugins/docker-compose",
      "docker compose version || exit 1",
      "echo 'Docker Compose installed'",
      "echo '======================================================================================'",
      "echo 'Installing Nginx...'",
      "sudo apt install -y nginx",
      "sudo systemctl start nginx",
      "sudo systemctl enable nginx",
      "sudo systemctl status nginx --no-pager || exit 1",
      "echo 'Nginx installed and configured'",
      "echo '======================================================================================'",
      "echo 'Installing AWS CLI...'",
      "curl \"https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip\" -o \"/tmp/awscliv2.zip\"",
      "sudo apt install -y unzip",
      "unzip -q /tmp/awscliv2.zip -d /tmp",
      "sudo /tmp/aws/install",
      "rm -rf /tmp/aws /tmp/awscliv2.zip",
      "aws --version || exit 1",
      "echo 'AWS CLI installed'",
      "echo '======================================================================================'",
      "echo 'Installing Node.js...'",
      "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
      "sudo apt install -y nodejs",
      "node --version || exit 1",
      "npm --version || exit 1",
      "echo 'Node.js installed'",
      "echo '======================================================================================'",
      "echo 'Setup complete!'",
      "echo 'Docker, Docker Compose, Nginx, AWS CLI, and Node.js installed'",
      "echo 'EC2 instance is ready to pull and run Docker images from ECR'",
      "echo '======================================================================================'"
    ]
  }

  provisioner "remote-exec" {
    on_failure = continue

    connection {
      type        = "ssh"
      user        = "ubuntu"
      private_key = var.private_key_content
      host        = self.public_ip
      timeout     = "10m"
    }

    inline = concat([
      "echo '======================================================================================'",
      "echo 'SSL Certificate Setup'",
      "echo '======================================================================================'",
      "echo 'Checking if SSL setup is enabled...'"
    ], 
    var.enable_ssl ? [
      "echo 'SSL setup is enabled for domains: ${join(", ", var.ssl_domains)}'",
      "echo 'Installing Certbot for SSL certificates...'",
      "sudo apt update -qq",
      "sudo apt install -y certbot python3-certbot-nginx",
      "echo 'Certbot installed'",
      "echo 'Creating Nginx configuration for SSL domains...'",
      "sudo tee /etc/nginx/sites-available/ssl-domains > /dev/null << 'NGINX_EOF'",
      "server {",
      "    listen 80;",
      "    server_name ${join(" ", var.ssl_domains)};",
      "    ",
      "    location /storybook/ {",
      "        alias /home/ubuntu/siargao-trading-road/nextjs/storybook-static/;",
      "        try_files \\$uri \\$uri/ /storybook/index.html;",
      "        index index.html;",
      "    }",
      "    ",
      "    location = /storybook {",
      "        return 301 /storybook/;",
      "    }",
      "    ",
      "    location / {",
      "        proxy_pass http://localhost:3021;",
      "        proxy_http_version 1.1;",
      "        proxy_set_header Upgrade \\$http_upgrade;",
      "        proxy_set_header Connection \"upgrade\";",
      "        proxy_set_header Host \\$host;",
      "        proxy_set_header X-Real-IP \\$remote_addr;",
      "        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;",
      "        proxy_set_header X-Forwarded-Proto \\$scheme;",
      "        proxy_cache_bypass \\$http_upgrade;",
      "    }",
      "    ",
      "    location /api {",
      "        proxy_pass http://localhost:3020;",
      "        proxy_http_version 1.1;",
      "        proxy_set_header Host \\$host;",
      "        proxy_set_header X-Real-IP \\$remote_addr;",
      "        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;",
      "        proxy_set_header X-Forwarded-Proto \\$scheme;",
      "    }",
      "    ",
      "    location /health {",
      "        access_log off;",
      "        return 200 \"healthy\\n\";",
      "        add_header Content-Type text/plain;",
      "    }",
      "}",
      "NGINX_EOF",
      "sudo ln -sf /etc/nginx/sites-available/ssl-domains /etc/nginx/sites-enabled/",
      "sudo nginx -t && sudo systemctl reload nginx",
      "echo 'Nginx configuration created'",
      "echo '======================================================================================'",
      "echo 'Generating SSL certificates with Let\\'s Encrypt...'",
      "sudo certbot --nginx -d ${join(" -d ", var.ssl_domains)} --non-interactive --agree-tos --email ${var.ssl_email} || echo ' SSL certificate generation failed - this can be retried manually'",
      "echo 'SSL setup completed'",
      "echo '======================================================================================'"
    ] : [
      "echo 'SSL setup is disabled - skipping SSL configuration'",
      "echo 'To enable SSL later, run: terraform apply with enable_ssl = true'"
    ], [
      "echo '======================================================================================'",
      "echo 'SSL setup phase completed!'",
      "echo '======================================================================================'"
    ])
  }
}

