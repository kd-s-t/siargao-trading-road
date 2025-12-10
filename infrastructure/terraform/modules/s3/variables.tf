variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
}

variable "build_retention_days" {
  description = "Number of days to retain mobile app builds"
  type        = number
  default     = 90
}

variable "public_read" {
  description = "Allow public read access to build artifacts"
  type        = bool
  default     = false
}

