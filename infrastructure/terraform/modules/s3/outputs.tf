output "bucket_name" {
  description = "Name of the S3 bucket for mobile builds"
  value       = aws_s3_bucket.mobile_builds.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.mobile_builds.arn
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.mobile_builds.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.mobile_builds.bucket_regional_domain_name
}

output "website_endpoint" {
  description = "Website endpoint URL"
  value       = aws_s3_bucket_website_configuration.mobile_builds.website_endpoint
}

output "public_url" {
  description = "Public URL pattern for accessing builds"
  value       = "https://${aws_s3_bucket.mobile_builds.bucket_regional_domain_name}"
}

