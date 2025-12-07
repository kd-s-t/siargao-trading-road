output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = module.ec2.public_ip
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = module.ec2.instance_id
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${module.security.private_key_file} ubuntu@${module.ec2.public_ip}"
}

output "ssh_private_key" {
  description = "Private key content for SSH access (for GitHub Actions)"
  value       = module.security.private_key_content
  sensitive   = true
}

output "ssh_key_file" {
  description = "Path to the generated private key file"
  value       = module.security.private_key_file
}

output "house_key" {
  description = "House key for GitHub Actions secret"
  value       = random_password.house_key.result
  sensitive   = true
}

output "ecr_frontend_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = module.ecr.frontend_repository_url
}

output "ecr_frontend_repository_name" {
  description = "Name of the frontend ECR repository"
  value       = module.ecr.frontend_repository_name
}

output "ecr_api_repository_url" {
  description = "URL of the API ECR repository"
  value       = module.ecr.api_repository_url
}

output "ecr_api_repository_name" {
  description = "Name of the API ECR repository"
  value       = module.ecr.api_repository_name
}

output "db_instance_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_instance_endpoint
}

output "db_instance_address" {
  description = "RDS PostgreSQL hostname"
  value       = module.rds.db_instance_address
}

output "db_instance_port" {
  description = "RDS PostgreSQL port"
  value       = module.rds.db_instance_port
}

output "db_name" {
  description = "Database name"
  value       = module.rds.db_name
}

output "db_username" {
  description = "Database master username"
  value       = module.rds.db_username
  sensitive   = true
}

output "db_password" {
  description = "Database master password (if auto-generated)"
  value       = var.db_password != "" ? null : random_password.db_password.result
  sensitive   = true
}

output "mobile_builds_bucket_name" {
  description = "S3 bucket name for mobile app builds"
  value       = module.s3_mobile.bucket_name
}

output "mobile_builds_public_url" {
  description = "Public URL for accessing mobile app builds"
  value       = module.s3_mobile.public_url
}

output "mobile_builds_download_url" {
  description = "Example download URL pattern for mobile builds"
  value       = "${module.s3_mobile.public_url}/android/app-release.apk"
}

output "messaging_images_bucket_name" {
  description = "S3 bucket name for messaging images"
  value       = length(module.s3_messaging_images) > 0 ? module.s3_messaging_images[0].bucket_name : null
}

output "messaging_images_bucket_arn" {
  description = "ARN of the messaging images S3 bucket"
  value       = length(module.s3_messaging_images) > 0 ? module.s3_messaging_images[0].bucket_arn : null
}

output "messaging_images_public_url" {
  description = "Public URL for accessing messaging images"
  value       = length(module.s3_messaging_images) > 0 ? module.s3_messaging_images[0].public_url : null
}

