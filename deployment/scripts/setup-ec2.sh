#!/bin/bash

# EC2 인스턴스 초기 설정 스크립트
set -e

echo "🔧 EC2 인스턴스 초기 설정 시작..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 1. 시스템 업데이트
log_info "시스템 패키지 업데이트 중..."
sudo yum update -y

# 2. 필수 패키지 설치
log_info "필수 패키지 설치 중..."
sudo yum install -y git curl wget nano htop

# 3. Docker 설치
log_info "Docker 설치 중..."
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# 4. Docker Compose 설치
log_info "Docker Compose 설치 중..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# 5. Node.js 설치
log_info "Node.js 설치 중..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

# 6. Nginx 설치 (백업용)
log_info "Nginx 설치 중..."
sudo amazon-linux-extras install -y nginx1
sudo systemctl enable nginx

# 7. Let's Encrypt 설치
log_info "Certbot 설치 중..."
sudo yum install -y python3-pip
sudo pip3 install certbot certbot-nginx

# 8. 방화벽 설정
log_info "방화벽 포트 열기..."
sudo yum install -y iptables-services
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 22 -j ACCEPT
sudo service iptables save

# 9. 스왑 파일 생성 (메모리 부족 방지)
log_info "스왑 파일 생성 중..."
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 10. 로그 로테이션 설정
log_info "로그 로테이션 설정 중..."
sudo tee /etc/logrotate.d/soap-ai << EOF
/var/log/soap-ai/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ec2-user ec2-user
}
EOF

# 11. 프로젝트 디렉토리 생성
log_info "프로젝트 디렉토리 생성 중..."
mkdir -p /home/ec2-user/soap-ai
mkdir -p /home/ec2-user/soap-ai/logs
mkdir -p /home/ec2-user/soap-ai/ssl

# 12. 환경 변수 설정
log_info "환경 변수 설정 중..."
cat >> ~/.bashrc << EOF

# SOAP AI 환경 변수
export SOAP_AI_HOME=/home/ec2-user/soap-ai
export NODE_ENV=production
export PATH=\$PATH:\$SOAP_AI_HOME/scripts
EOF

# 13. 자동 배포 스크립트 권한 설정
log_info "스크립트 권한 설정 중..."
chmod +x /home/ec2-user/soap-ai/deployment/scripts/*.sh

# 14. 시스템 서비스 등록
log_info "시스템 서비스 등록 중..."
sudo tee /etc/systemd/system/soap-ai.service << EOF
[Unit]
Description=SOAP AI Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/soap-ai
ExecStart=/usr/local/bin/docker-compose -f deployment/docker/docker-compose.yml up -d
ExecStop=/usr/local/bin/docker-compose -f deployment/docker/docker-compose.yml down
User=ec2-user

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable soap-ai

log_info "✅ EC2 초기 설정 완료!"
log_warn "재부팅 후 Docker 그룹 권한이 적용됩니다."
log_info "다음 단계:"
log_info "1. 도메인 DNS 설정"
log_info "2. SSL 인증서 발급: sudo certbot --nginx -d your-domain.com"
log_info "3. 프로젝트 코드 클론 및 배포"

echo "재부팅하시겠습니까? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    sudo reboot
fi