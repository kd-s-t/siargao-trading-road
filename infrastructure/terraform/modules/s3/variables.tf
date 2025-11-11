variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
}

variable "build_retention_days" {
  description = "Number of days to retain mobile app builds"
  type        = number
  default     = 90
}

