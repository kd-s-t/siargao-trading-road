resource "tls_private_key" "wholesale_key" {
  algorithm = "ED25519"
  rsa_bits  = 4096
}

resource "aws_key_pair" "wholesale_key" {
  key_name   = "wholesale-key-${var.environment}"
  public_key = tls_private_key.wholesale_key.public_key_openssh

  tags = {
    Name = "wholesale-key-${var.environment}"
    Project = "SiargaoTradingRoad"
    Environment = var.environment
  }
}

resource "local_file" "private_key" {
  content  = tls_private_key.wholesale_key.private_key_openssh
  filename = "${path.module}/wholesale-key-${var.environment}.pem"
  file_permission = "0600"
}

resource "aws_security_group" "wholesale_sg" {
  name        = "wholesale-sg-${var.environment}"
  description = "Security group for Siargao Trading Road EC2 instance"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Next.js web app"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Go API"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "wholesale-sg-${var.environment}"
    Project = "SiargaoTradingRoad"
    Environment = var.environment
  }
}

