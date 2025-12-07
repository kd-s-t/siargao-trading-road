variable "ami_id" {
  description = "AMI ID for the EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type - KEEP SMALL (t3.micro, t3.small, t2.micro only) - DO NOT USE LARGE INSTANCES"
  type        = string
  
  validation {
    condition = can(regex("^(t2\\.micro|t3\\.micro|t3\\.small)$", var.instance_type))
    error_message = "Instance type must be t2.micro, t3.micro, or t3.small only. Large instances are not allowed to prevent high costs."
  }
}

variable "public_key_path" {
  description = "Path to the public SSH key"
  type        = string
}

variable "private_key_path" {
  description = "Path to the private SSH key"
  type        = string
}

variable "repo_url" {
  description = "GitHub repository URL for the application"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
}

variable "environment" {
  description = "Environment (staging, production)"
  type        = string
  default     = "staging"
}

variable "key_pair_name" {
  description = "Name of the AWS key pair from security module"
  type        = string
}

variable "security_group_id" {
  description = "ID of the security group from security module"
  type        = string
}

variable "private_key_content" {
  description = "Private key content from security module"
  type        = string
  sensitive   = true
}

variable "instance_profile_name" {
  description = "Name of the IAM instance profile from IAM module"
  type        = string
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

variable "enable_ssl" {
  description = "Whether to enable SSL certificate generation with Let's Encrypt"
  type        = bool
  default     = false
}

variable "create_eip" {
  description = "Whether to create an Elastic IP for the instance"
  type        = bool
  default     = false
}

