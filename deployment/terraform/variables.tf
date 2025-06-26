# AWS 설정
variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# EC2 설정
variable "instance_type" {
  description = "EC2 인스턴스 타입"
  type        = string
  default     = "t3.medium"
}

variable "ami_id" {
  description = "EC2 AMI ID (Amazon Linux 2)"
  type        = string
  default     = "ami-0c76973fbe0ee100c" # Amazon Linux 2 in ap-northeast-2
}

# 네트워크 보안
variable "allowed_ssh_ips" {
  description = "SSH 접근을 허용할 IP 주소 목록"
  type        = list(string)
  default     = ["0.0.0.0/0"] # 프로덕션에서는 특정 IP로 제한 권장
}

# SSH 키
variable "public_key_path" {
  description = "SSH 퍼블릭 키 파일 경로"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# 도메인 설정
variable "domain_name" {
  description = "도메인 이름 (선택사항)"
  type        = string
  default     = ""
}

# 백업 설정
variable "enable_backup" {
  description = "S3 백업 버킷 생성 여부"
  type        = bool
  default     = true
}

# 알림 설정
variable "notification_email" {
  description = "알림을 받을 이메일 주소"
  type        = string
  default     = ""
}

# 태그 설정
variable "project_tags" {
  description = "프로젝트 공통 태그"
  type        = map(string)
  default = {
    Project     = "SOAP-AI"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}