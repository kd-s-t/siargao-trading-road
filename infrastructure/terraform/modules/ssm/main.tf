locals {
  parameter_prefix = "/siargaotradingroad/${var.environment}"
}

resource "aws_ssm_parameter" "s3_bucket" {
  count = var.s3_bucket_name != "" ? 1 : 0
  name  = "${local.parameter_prefix}/S3_BUCKET"
  type  = "String"
  value = var.s3_bucket_name
}

resource "aws_ssm_parameter" "aws_access_key_id" {
  count = var.aws_access_key_id != "" ? 1 : 0
  name  = "${local.parameter_prefix}/AWS_ACCESS_KEY_ID"
  type  = "SecureString"
  value = var.aws_access_key_id
}

resource "aws_ssm_parameter" "aws_secret_access_key" {
  count = var.aws_secret_access_key != "" ? 1 : 0
  name  = "${local.parameter_prefix}/AWS_SECRET_ACCESS_KEY"
  type  = "SecureString"
  value = var.aws_secret_access_key
}

resource "aws_ssm_parameter" "aws_region" {
  name  = "${local.parameter_prefix}/AWS_REGION"
  type  = "String"
  value = "us-east-1"
}

resource "aws_ssm_parameter" "jwt_secret" {
  count = var.jwt_secret != "" ? 1 : 0
  name  = "${local.parameter_prefix}/JWT_SECRET"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "db_host" {
  count = var.db_host != "" ? 1 : 0
  name  = "${local.parameter_prefix}/DB_HOST"
  type  = "String"
  value = var.db_host
}

resource "aws_ssm_parameter" "db_port" {
  name  = "${local.parameter_prefix}/DB_PORT"
  type  = "String"
  value = var.db_port
}

resource "aws_ssm_parameter" "db_user" {
  count = var.db_user != "" ? 1 : 0
  name  = "${local.parameter_prefix}/DB_USER"
  type  = "String"
  value = var.db_user
}

resource "aws_ssm_parameter" "db_password" {
  count = var.db_password != "" ? 1 : 0
  name  = "${local.parameter_prefix}/DB_PASSWORD"
  type  = "SecureString"
  value = var.db_password
}

resource "aws_ssm_parameter" "db_name" {
  count = var.db_name != "" ? 1 : 0
  name  = "${local.parameter_prefix}/DB_NAME"
  type  = "String"
  value = var.db_name
}

