output "bucket_name" {
  description = "Name of the S3 bucket for messaging images"
  value       = aws_s3_bucket.messaging_images.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.messaging_images.arn
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.messaging_images.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.messaging_images.bucket_regional_domain_name
}

output "public_url" {
  description = "Public URL pattern for accessing messaging images"
  value       = "https://${aws_s3_bucket.messaging_images.bucket_regional_domain_name}"
}

