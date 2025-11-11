resource "aws_db_subnet_group" "wholesale_db_subnet" {
  name       = "wholesale-db-subnet-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "wholesale-db-subnet-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "wholesale-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ec2_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "wholesale-rds-sg-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_db_instance" "wholesale_db" {
  identifier = "wholesale-db-${var.environment}"

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

  db_subnet_group_name   = aws_db_subnet_group.wholesale_db_subnet.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = false

  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  skip_final_snapshot       = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "wholesale-db-${var.environment}-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  monitoring_interval            = 60
  monitoring_role_arn            = aws_iam_role.rds_monitoring.arn

  tags = {
    Name        = "wholesale-db-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_iam_role" "rds_monitoring" {
  name = "wholesale-rds-monitoring-${var.environment}"

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
    Name        = "wholesale-rds-monitoring-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

