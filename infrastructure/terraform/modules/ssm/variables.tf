variable "environment" {
  description = "Environment (staging, production)"
  type        = string
  default     = "staging"
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID for S3 access"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key for S3 access"
  type        = string
  sensitive   = true
  default     = ""
}

variable "s3_bucket_name" {
  description = "S3 bucket name for user uploads"
  type        = string
  default     = ""
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_host" {
  description = "Database host"
  type        = string
  default     = ""
}

variable "db_port" {
  description = "Database port"
  type        = string
  default     = "5432"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = ""
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = ""
}

