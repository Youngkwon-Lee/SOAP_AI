# Terraform 변수 설정 예시
# 이 파일을 terraform.tfvars로 복사하고 실제 값으로 수정하세요

# AWS 설정
aws_region = "ap-northeast-2"
environment = "prod"

# EC2 설정
instance_type = "t3.medium"  # 또는 t3.small (개발용), t3.large (높은 트래픽용)
ami_id = "ami-0c76973fbe0ee100c"  # Amazon Linux 2 in ap-northeast-2

# 보안 설정
allowed_ssh_ips = [
  "123.456.789.0/32",  # 귀하의 공인 IP 주소
  "office.company.com/32"  # 회사 사무실 IP (예시)
]

# SSH 키 설정
public_key_path = "~/.ssh/soap-ai-key.pub"  # SSH 퍼블릭 키 파일 경로

# 도메인 설정 (선택사항)
domain_name = "soap-ai.example.com"  # 실제 도메인으로 변경
# domain_name = ""  # 도메인 없이 IP만 사용하려면 빈 문자열

# 백업 설정
enable_backup = true  # S3 백업 버킷 생성 여부

# 알림 설정
notification_email = "admin@example.com"  # CloudWatch 알림을 받을 이메일

# 프로젝트 태그
project_tags = {
  Project     = "SOAP-AI"
  Environment = "production"
  ManagedBy   = "Terraform"
  Owner       = "개발팀"
  CostCenter  = "IT"
}