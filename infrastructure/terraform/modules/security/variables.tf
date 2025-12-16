variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
}

variable "allowed_cidr_blocks" {
  description = "List of CIDR blocks allowed to access EC2 (SSH, HTTP, HTTPS, API ports)"
  type        = list(string)
  default     = []
}

