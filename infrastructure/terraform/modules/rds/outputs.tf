output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.siargaotradingroad_db.id
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.siargaotradingroad_db.endpoint
}

output "db_instance_address" {
  description = "RDS instance hostname"
  value       = aws_db_instance.siargaotradingroad_db.address
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.siargaotradingroad_db.port
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.siargaotradingroad_db.arn
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.siargaotradingroad_db.db_name
}

output "db_username" {
  description = "Database master username"
  value       = aws_db_instance.siargaotradingroad_db.username
  sensitive   = true
}

