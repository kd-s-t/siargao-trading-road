variable "aws_region" {}
variable "ami_id" {}
variable "instance_type" {}
variable "public_key_path" {}
variable "private_key_path" {}
variable "repo_url" {}
variable "environment" {
  description = "Environment (production, staging)"
  type        = string
  default     = "production"
}

variable "enable_ssl" {
  description = "Whether to enable SSL certificate generation with Let's Encrypt"
  type        = bool
  default     = false
}

variable "ssl_domains" {
  description = "List of domains for SSL certificates"
  type        = list(string)
  default     = []
}

variable "ssl_email" {
  description = "Email address for Let's Encrypt SSL certificate notifications"
  type        = string
  default     = "admin@siargaotradingroad.com"
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "siargaotradingroad"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "siargaotradingroad_admin"
}

variable "db_password" {
  description = "RDS master password (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "rds_allocated_storage" {
  description = "RDS initial allocated storage in GB"
  type        = number
  default     = 20
}

variable "rds_max_allocated_storage" {
  description = "RDS maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "rds_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

variable "rds_skip_final_snapshot" {
  description = "Skip final snapshot when destroying RDS (set to false for production)"
  type        = bool
  default     = false
}

variable "rds_publicly_accessible" {
  description = "Whether the RDS instance should be publicly accessible"
  type        = bool
  default     = false
}

variable "rds_allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access RDS directly (e.g., [\"1.2.3.4/32\"])"
  type        = list(string)
  default     = []
}

variable "mobile_build_retention_days" {
  description = "Number of days to retain mobile app builds in S3"
  type        = number
  default     = 90
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID for S3 access (optional, can be set via SSM manually)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key for S3 access (optional, can be set via SSM manually)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "jwt_secret" {
  description = "JWT secret key (optional, will be auto-generated if not provided)"
  type        = string
  sensitive   = true
  default     = ""
}

