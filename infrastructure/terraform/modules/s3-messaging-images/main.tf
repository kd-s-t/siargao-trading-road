resource "aws_s3_bucket" "messaging_images" {
  bucket = "siargaotradingroad-messaging-images-${var.environment}"

  tags = {
    Name        = "siargaotradingroad-messaging-images-${var.environment}"
    Environment = var.environment
    Project     = "SiargaoTradingRoad"
  }
}

resource "aws_s3_bucket_versioning" "messaging_images" {
  bucket = aws_s3_bucket.messaging_images.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_ownership_controls" "messaging_images" {
  bucket = aws_s3_bucket.messaging_images.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "messaging_images" {
  bucket = aws_s3_bucket.messaging_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "messaging_images" {
  bucket = aws_s3_bucket.messaging_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.messaging_images.arn}/*"
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
        Resource = "${aws_s3_bucket.messaging_images.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.messaging_images]
}

resource "aws_s3_bucket_cors_configuration" "messaging_images" {
  bucket = aws_s3_bucket.messaging_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "messaging_images" {
  bucket = aws_s3_bucket.messaging_images.id

  rule {
    id     = "delete-old-messaging-images"
    status = "Enabled"

    filter {}

    expiration {
      days = var.retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.retention_days
    }
  }
}

