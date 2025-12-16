resource "tls_private_key" "siargaotradingroad_key" {
  algorithm = "ED25519"
  rsa_bits  = 4096
}

resource "aws_key_pair" "siargaotradingroad_key" {
  key_name   = "siargaotradingroad-key-${var.environment}"
  public_key = tls_private_key.siargaotradingroad_key.public_key_openssh

  tags = {
    Name = "siargaotradingroad-key-${var.environment}"
    Project = "SiargaoTradingRoad"
    Environment = var.environment
  }
}

resource "local_file" "private_key" {
  content  = tls_private_key.siargaotradingroad_key.private_key_openssh
  filename = "${path.module}/siargaotradingroad-key-${var.environment}.pem"
  file_permission = "0600"
}

resource "aws_security_group" "siargaotradingroad_sg" {
  name        = "siargaotradingroad-sg-${var.environment}"
  description = "Security group for Siargao Trading Road EC2 instance"

  dynamic "ingress" {
    for_each = length(var.allowed_cidr_blocks) > 0 ? var.allowed_cidr_blocks : ["0.0.0.0/0"]
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = length(var.allowed_cidr_blocks) > 0 ? var.allowed_cidr_blocks : ["0.0.0.0/0"]
    content {
      description = "HTTP"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = length(var.allowed_cidr_blocks) > 0 ? var.allowed_cidr_blocks : ["0.0.0.0/0"]
    content {
      description = "HTTPS"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = length(var.allowed_cidr_blocks) > 0 ? var.allowed_cidr_blocks : ["0.0.0.0/0"]
    content {
      description = "Next.js web app"
      from_port   = 3021
      to_port     = 3021
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = length(var.allowed_cidr_blocks) > 0 ? var.allowed_cidr_blocks : ["0.0.0.0/0"]
    content {
      description = "Go API"
      from_port   = 3020
      to_port     = 3020
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "siargaotradingroad-sg-${var.environment}"
    Project = "SiargaoTradingRoad"
    Environment = var.environment
  }
}

