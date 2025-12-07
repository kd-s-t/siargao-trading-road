aws_region = "us-east-1"
ami_id = "ami-0c7217cdde317cfec"
# IMPORTANT: Keep instance type small (t3.micro, t2.micro, or t3.small only) - DO NOT USE LARGE INSTANCES
instance_type = "t3.micro"
public_key_path = "./modules/security/splitsafe-key-development.pem.pub"
private_key_path = "./modules/security/splitsafe-key-development.pem"
repo_url = "https://github.com/kd-s-t/siargao-trading-road.git"
environment = "development"

enable_ssl = true
ssl_domains = ["siargaotradingroad.com", "www.siargaotradingroad.com"]
ssl_email = "admin@siargaotradingroad.com"

db_name = "siargaotradingroad"
db_username = "siargaotradingroad_admin"
db_password = ""
rds_instance_class = "db.t3.micro"
rds_allocated_storage = 20
rds_max_allocated_storage = 100
rds_engine_version = "17.6"
rds_backup_retention_period = 7
rds_skip_final_snapshot = true
rds_publicly_accessible = true
rds_allowed_cidr_blocks = ["49.148.247.52/32"]

mobile_build_retention_days = 90

