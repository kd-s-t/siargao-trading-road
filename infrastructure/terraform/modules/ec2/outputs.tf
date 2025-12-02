output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.siargaotradingroad_eip.public_ip
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.siargaotradingroad_server.id
}

output "ssh_command" {
  description = "SSH command to connect to the EC2 instance"
  value       = "ssh -i ${var.private_key_path} ubuntu@${aws_eip.siargaotradingroad_eip.public_ip}"
}

