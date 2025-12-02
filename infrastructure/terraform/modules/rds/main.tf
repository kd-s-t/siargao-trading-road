resource "aws_db_subnet_group" "siargaotradingroad_db_subnet" {
  name       = "siargaotradingroad-db-subnet-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "siargaotradingroad-db-subnet-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "siargaotradingroad-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ec2_security_group_id]
  }

  dynamic "ingress" {
    for_each = length(var.allowed_cidr_blocks) > 0 ? [1] : []
    content {
      description = "PostgreSQL from allowed IPs"
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = var.allowed_cidr_blocks
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "siargaotradingroad-rds-sg-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_db_instance" "siargaotradingroad_db" {
  identifier = "siargaotradingroad-db-${var.environment}"

  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.siargaotradingroad_db_subnet.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = var.publicly_accessible

  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "siargaotradingroad-db-${var.environment}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  monitoring_interval            = 60
  monitoring_role_arn            = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "siargaotradingroad-db-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_iam_role" "rds_monitoring" {
  name = "siargaotradingroad-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "siargaotradingroad-rds-monitoring-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

