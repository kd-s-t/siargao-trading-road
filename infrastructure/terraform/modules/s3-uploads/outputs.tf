output "bucket_name" {
  description = "Name of the S3 bucket for user uploads"
  value       = aws_s3_bucket.user_uploads.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.user_uploads.arn
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.user_uploads.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.user_uploads.bucket_regional_domain_name
}

output "public_url" {
  description = "Public URL pattern for accessing uploads"
  value       = "https://${aws_s3_bucket.user_uploads.bucket_regional_domain_name}"
}

