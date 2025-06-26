# EC2 인스턴스 정보
output "instance_id" {
  description = "EC2 인스턴스 ID"
  value       = aws_instance.soap_ai_server.id
}

output "instance_public_ip" {
  description = "EC2 인스턴스 퍼블릭 IP"
  value       = aws_eip.soap_ai_eip.public_ip
}

output "instance_private_ip" {
  description = "EC2 인스턴스 프라이빗 IP"
  value       = aws_instance.soap_ai_server.private_ip
}

# 네트워크 정보
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.soap_ai_vpc.id
}

output "subnet_id" {
  description = "퍼블릭 서브넷 ID"
  value       = aws_subnet.soap_ai_public_subnet.id
}

output "security_group_id" {
  description = "보안 그룹 ID"
  value       = aws_security_group.soap_ai_sg.id
}

# 도메인 정보
output "domain_name" {
  description = "도메인 이름"
  value       = var.domain_name != "" ? var.domain_name : "도메인 설정 안됨"
}

output "route53_zone_id" {
  description = "Route53 호스팅 영역 ID"
  value       = var.domain_name != "" ? aws_route53_zone.soap_ai_zone[0].zone_id : "도메인 설정 안됨"
}

# 백업 정보
output "backup_bucket_name" {
  description = "백업 S3 버킷 이름"
  value       = var.enable_backup ? aws_s3_bucket.soap_ai_backup[0].bucket : "백업 비활성화"
}

# SSH 접속 정보
output "ssh_command" {
  description = "SSH 접속 명령어"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${aws_eip.soap_ai_eip.public_ip}"
}

# 배포 URL
output "application_url" {
  description = "애플리케이션 접속 URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_eip.soap_ai_eip.public_ip}"
}

# CloudWatch 알람 정보
output "cloudwatch_alarm_name" {
  description = "CloudWatch CPU 알람 이름"
  value       = aws_cloudwatch_metric_alarm.soap_ai_cpu_alarm.alarm_name
}

# SNS 토픽 정보
output "sns_topic_arn" {
  description = "SNS 알림 토픽 ARN"
  value       = aws_sns_topic.soap_ai_alerts.arn
}