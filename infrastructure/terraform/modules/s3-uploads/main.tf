resource "aws_s3_bucket" "user_uploads" {
  bucket = "siargaotradingroad-user-uploads-${var.environment}"

  tags = {
    Name        = "siargaotradingroad-user-uploads-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_s3_bucket_versioning" "user_uploads" {
  bucket = aws_s3_bucket.user_uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "user_uploads" {
  bucket = aws_s3_bucket.user_uploads.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "user_uploads" {
  bucket = aws_s3_bucket.user_uploads.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.user_uploads.arn}/*"
      },
      {
        Sid    = "AllowPutObject"
        Effect = "Allow"
        Principal = {
          AWS = var.ec2_role_arn
        }
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.user_uploads.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.user_uploads]
}

resource "aws_s3_bucket_cors_configuration" "user_uploads" {
  bucket = aws_s3_bucket.user_uploads.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "user_uploads" {
  bucket = aws_s3_bucket.user_uploads.id

  rule {
    id     = "delete-old-uploads"
    status = "Enabled"

    expiration {
      days = var.upload_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.upload_retention_days
    }
  }
}

