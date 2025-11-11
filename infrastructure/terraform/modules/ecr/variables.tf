variable "environment" {
  description = "Environment (staging, production)"
  type        = string
}

variable "ec2_role_arn" {
  description = "ARN of the EC2 instance role that can pull from ECR"
  type        = string
  default     = ""
}

