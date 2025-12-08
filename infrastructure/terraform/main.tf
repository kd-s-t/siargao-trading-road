terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "random_password" "house_key" {
  length  = 32
  special = true
  upper   = true
  lower   = true
  numeric = true
}

resource "random_password" "db_password" {
  length  = 16
  special = false
  upper   = true
  lower   = true
  numeric = true
}

module "security" {
  source = "./modules/security"
  
  environment = var.environment
}

module "iam" {
  source = "./modules/iam"
  
  environment = var.environment
  aws_region  = var.aws_region
}

module "ssm" {
  source = "./modules/ssm"
  
  environment = var.environment
  
  s3_bucket_name        = module.s3_uploads.bucket_name
  aws_access_key_id     = var.aws_access_key_id
  aws_secret_access_key = var.aws_secret_access_key
  jwt_secret            = var.jwt_secret != "" ? var.jwt_secret : random_password.house_key.result
  
  db_host     = module.rds.db_instance_address
  db_port     = module.rds.db_instance_port
  db_user     = var.db_username
  db_password = var.db_password != "" ? var.db_password : random_password.db_password.result
  db_name     = var.db_name
}

module "ec2" {
  source = "./modules/ec2"
  
  aws_region           = var.aws_region
  ami_id               = var.ami_id
  instance_type        = var.instance_type
  public_key_path      = var.public_key_path
  private_key_path     = var.private_key_path
  repo_url             = var.repo_url
  environment          = var.environment
  key_pair_name        = module.security.key_pair_name
  security_group_id    = module.security.security_group_id
  private_key_content  = module.security.private_key_content
  instance_profile_name = module.iam.ec2_instance_profile_name
  
  enable_ssl           = var.enable_ssl
  ssl_domains          = var.ssl_domains
  ssl_email            = var.ssl_email
  create_eip           = false
}

module "ecr" {
  source = "./modules/ecr"
  
  environment   = var.environment
  ec2_role_arn = module.iam.ec2_role_arn
}

module "rds" {
  source = "./modules/rds"
  
  environment            = var.environment
  vpc_id                = data.aws_vpc.default.id
  subnet_ids            = data.aws_subnets.default.ids
  ec2_security_group_id = module.security.security_group_id
  
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password != "" ? var.db_password : random_password.db_password.result
  
  instance_class         = var.rds_instance_class
  allocated_storage      = var.rds_allocated_storage
  max_allocated_storage  = var.rds_max_allocated_storage
  engine_version         = var.rds_engine_version
  backup_retention_period = var.rds_backup_retention_period
  skip_final_snapshot    = var.rds_skip_final_snapshot
  publicly_accessible    = var.rds_publicly_accessible
  allowed_cidr_blocks   = var.rds_allowed_cidr_blocks
}

module "s3_mobile" {
  source = "./modules/s3"
  
  environment         = var.environment
  build_retention_days = var.mobile_build_retention_days
}

module "s3_uploads" {
  source = "./modules/s3-uploads"
  
  environment          = var.environment
  ec2_role_arn         = module.iam.ec2_role_arn
  upload_retention_days = 365
}

module "s3_messaging_images" {
  source = "./modules/s3-messaging-images"
  
  count = contains(["development", "production"], var.environment) ? 1 : 0
  
  environment    = var.environment
  ec2_role_arn   = module.iam.ec2_role_arn
  retention_days = 365
}

