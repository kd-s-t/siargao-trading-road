locals {
  parameter_prefix = "/siargaotradingroad/${var.environment}"
}

resource "aws_ssm_parameter" "s3_bucket" {
  name      = "${local.parameter_prefix}/S3_BUCKET"
  type      = "String"
  value     = var.s3_bucket_name
  overwrite = true
}

resource "aws_ssm_parameter" "aws_access_key_id" {
  count     = var.aws_access_key_id != "" ? 1 : 0
  name      = "${local.parameter_prefix}/AWS_ACCESS_KEY_ID"
  type      = "SecureString"
  value     = var.aws_access_key_id
  overwrite = true
}

resource "aws_ssm_parameter" "aws_secret_access_key" {
  count     = var.aws_secret_access_key != "" ? 1 : 0
  name      = "${local.parameter_prefix}/AWS_SECRET_ACCESS_KEY"
  type      = "SecureString"
  value     = var.aws_secret_access_key
  overwrite = true
}

resource "aws_ssm_parameter" "aws_region" {
  name      = "${local.parameter_prefix}/AWS_REGION"
  type      = "String"
  value     = "us-east-1"
  overwrite = true
}

resource "aws_ssm_parameter" "jwt_secret" {
  name      = "${local.parameter_prefix}/JWT_SECRET"
  type      = "SecureString"
  value     = var.jwt_secret
  overwrite = true
}

resource "aws_ssm_parameter" "db_host" {
  name      = "${local.parameter_prefix}/DB_HOST"
  type      = "String"
  value     = var.db_host
  overwrite = true
}

resource "aws_ssm_parameter" "db_port" {
  name      = "${local.parameter_prefix}/DB_PORT"
  type      = "String"
  value     = var.db_port
  overwrite = true
}

resource "aws_ssm_parameter" "db_user" {
  name      = "${local.parameter_prefix}/DB_USER"
  type      = "String"
  value     = var.db_user
  overwrite = true
}

resource "aws_ssm_parameter" "db_password" {
  name      = "${local.parameter_prefix}/DB_PASSWORD"
  type      = "SecureString"
  value     = var.db_password
  overwrite = true
}

resource "aws_ssm_parameter" "db_name" {
  name      = "${local.parameter_prefix}/DB_NAME"
  type      = "String"
  value     = var.db_name
  overwrite = true
}

