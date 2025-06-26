# SOAP AI EC2 Infrastructure as Code
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC 및 네트워크 설정
resource "aws_vpc" "soap_ai_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "soap-ai-vpc"
    Project = "SOAP-AI"
  }
}

# 인터넷 게이트웨이
resource "aws_internet_gateway" "soap_ai_igw" {
  vpc_id = aws_vpc.soap_ai_vpc.id

  tags = {
    Name = "soap-ai-igw"
    Project = "SOAP-AI"
  }
}

# 퍼블릭 서브넷
resource "aws_subnet" "soap_ai_public_subnet" {
  vpc_id                  = aws_vpc.soap_ai_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "soap-ai-public-subnet"
    Project = "SOAP-AI"
  }
}

# 라우팅 테이블
resource "aws_route_table" "soap_ai_public_rt" {
  vpc_id = aws_vpc.soap_ai_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.soap_ai_igw.id
  }

  tags = {
    Name = "soap-ai-public-rt"
    Project = "SOAP-AI"
  }
}

# 라우팅 테이블 연결
resource "aws_route_table_association" "soap_ai_public_rta" {
  subnet_id      = aws_subnet.soap_ai_public_subnet.id
  route_table_id = aws_route_table.soap_ai_public_rt.id
}

# 보안 그룹
resource "aws_security_group" "soap_ai_sg" {
  name_prefix = "soap-ai-sg"
  vpc_id      = aws_vpc.soap_ai_vpc.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_ips
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # 모든 아웃바운드 트래픽 허용
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "soap-ai-security-group"
    Project = "SOAP-AI"
  }
}

# Key Pair
resource "aws_key_pair" "soap_ai_key" {
  key_name   = "soap-ai-key"
  public_key = file(var.public_key_path)

  tags = {
    Name = "soap-ai-key"
    Project = "SOAP-AI"
  }
}

# EC2 인스턴스
resource "aws_instance" "soap_ai_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.soap_ai_key.key_name
  vpc_security_group_ids = [aws_security_group.soap_ai_sg.id]
  subnet_id              = aws_subnet.soap_ai_public_subnet.id

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = file("${path.module}/user-data.sh")

  tags = {
    Name = "soap-ai-server"
    Project = "SOAP-AI"
    Environment = var.environment
  }
}

# Elastic IP
resource "aws_eip" "soap_ai_eip" {
  instance = aws_instance.soap_ai_server.id
  domain   = "vpc"

  tags = {
    Name = "soap-ai-eip"
    Project = "SOAP-AI"
  }
}

# Route 53 도메인 설정 (선택)
resource "aws_route53_zone" "soap_ai_zone" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name

  tags = {
    Name = "soap-ai-zone"
    Project = "SOAP-AI"
  }
}

resource "aws_route53_record" "soap_ai_a_record" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = aws_route53_zone.soap_ai_zone[0].zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.soap_ai_eip.public_ip]
}

# CloudWatch 알람 설정
resource "aws_cloudwatch_metric_alarm" "soap_ai_cpu_alarm" {
  alarm_name          = "soap-ai-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_sns_topic.soap_ai_alerts.arn]

  dimensions = {
    InstanceId = aws_instance.soap_ai_server.id
  }

  tags = {
    Name = "soap-ai-cpu-alarm"
    Project = "SOAP-AI"
  }
}

# SNS 토픽 (알림용)
resource "aws_sns_topic" "soap_ai_alerts" {
  name = "soap-ai-alerts"

  tags = {
    Name = "soap-ai-alerts"
    Project = "SOAP-AI"
  }
}

# S3 백업 버킷 (선택)
resource "aws_s3_bucket" "soap_ai_backup" {
  count  = var.enable_backup ? 1 : 0
  bucket = "soap-ai-backup-${random_string.bucket_suffix.result}"

  tags = {
    Name = "soap-ai-backup"
    Project = "SOAP-AI"
  }
}

resource "aws_s3_bucket_versioning" "soap_ai_backup_versioning" {
  count  = var.enable_backup ? 1 : 0
  bucket = aws_s3_bucket.soap_ai_backup[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "soap_ai_backup_encryption" {
  count  = var.enable_backup ? 1 : 0
  bucket = aws_s3_bucket.soap_ai_backup[0].id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}