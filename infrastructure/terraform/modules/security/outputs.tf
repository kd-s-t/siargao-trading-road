output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.siargaotradingroad_sg.id
}

output "security_group_name" {
  description = "Name of the security group"
  value       = aws_security_group.siargaotradingroad_sg.name
}

output "key_pair_name" {
  description = "Name of the AWS key pair"
  value       = aws_key_pair.siargaotradingroad_key.key_name
}

output "private_key_content" {
  description = "Private key content for SSH access"
  value       = tls_private_key.siargaotradingroad_key.private_key_openssh
  sensitive   = true
}

output "private_key_file" {
  description = "Path to the generated private key file"
  value       = local_file.private_key.filename
}

