variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "upload_retention_days" {
  description = "Number of days to retain uploaded files"
  type        = number
  default     = 365
}

variable "ec2_role_arn" {
  description = "ARN of the EC2 IAM role for S3 upload permissions"
  type        = string
}

