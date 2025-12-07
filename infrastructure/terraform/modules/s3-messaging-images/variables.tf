variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "retention_days" {
  description = "Number of days to retain messaging images"
  type        = number
  default     = 365
}

variable "ec2_role_arn" {
  description = "ARN of the EC2 IAM role for S3 upload permissions"
  type        = string
}

