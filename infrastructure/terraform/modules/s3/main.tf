resource "aws_s3_bucket" "mobile_builds" {
  bucket = "siargaotradingroad-mobile-builds-${var.environment}"

  tags = {
    Name        = "siargaotradingroad-mobile-builds-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_s3_bucket_versioning" "mobile_builds" {
  bucket = aws_s3_bucket.mobile_builds.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "mobile_builds" {
  bucket = aws_s3_bucket.mobile_builds.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "mobile_builds" {
  bucket = aws_s3_bucket.mobile_builds.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.mobile_builds.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.mobile_builds]
}

resource "aws_s3_bucket_cors_configuration" "mobile_builds" {
  bucket = aws_s3_bucket.mobile_builds.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "mobile_builds" {
  bucket = aws_s3_bucket.mobile_builds.id

  rule {
    id     = "delete-old-builds"
    status = "Enabled"

    expiration {
      days = var.build_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.build_retention_days
    }
  }
}

resource "aws_s3_bucket_website_configuration" "mobile_builds" {
  bucket = aws_s3_bucket.mobile_builds.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

