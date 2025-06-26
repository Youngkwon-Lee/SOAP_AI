#!/bin/bash

# 기존 EC2에 SOAP AI 배포 스크립트
set -e

# EC2 정보 설정
EC2_HOST="43.201.5.96"
EC2_USER="ec2-user"
SSH_KEY_PATH="/mnt/c/Users/YK/youngkwon.pem"
DOMAIN="soapai.shop"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "🚀 SOAP AI EC2 배포 시작..."

# 1. SSH 연결 테스트
log_info "📡 EC2 연결 테스트 중..."
if ssh -i $SSH_KEY_PATH -o ConnectTimeout=10 $EC2_USER@$EC2_HOST "echo 'SSH 연결 성공'" 2>/dev/null; then
    log_info "✅ EC2 SSH 연결 성공"
else
    log_error "❌ EC2 SSH 연결 실패. SSH 키와 보안 그룹을 확인하세요."
    echo "다음을 확인하세요:"
    echo "1. SSH 키 파일 경로: $SSH_KEY_PATH"
    echo "2. 보안 그룹에서 SSH(22) 포트 허용"
    echo "3. EC2 인스턴스가 실행 중인지 확인"
    exit 1
fi

# 2. EC2 초기 설정 실행
log_info "🔧 EC2 초기 설정 실행 중..."
scp -i $SSH_KEY_PATH ../scripts/setup-ec2.sh $EC2_USER@$EC2_HOST:/tmp/
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "chmod +x /tmp/setup-ec2.sh && sudo /tmp/setup-ec2.sh"

# 3. 프로젝트 코드 업로드
log_info "📁 프로젝트 코드 업로드 중..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST "rm -rf /home/ec2-user/soap-ai"
scp -i $SSH_KEY_PATH -r ../../ $EC2_USER@$EC2_HOST:/home/ec2-user/soap-ai

# 4. 환경 변수 설정
log_info "⚙️ 환경 변수 설정 중..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST << 'EOF'
cd /home/ec2-user/soap-ai
cp deployment/.env.production .env

# .env 파일 수정 (도메인 설정)
sed -i "s/your-domain.com/soapai.shop/g" .env
sed -i "s/your-email@domain.com/admin@soapai.shop/g" .env

echo "환경 변수 파일 생성 완료"
EOF

# 5. Docker 및 Node.js 설정
log_info "🐳 Docker 환경 설정 중..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST << 'EOF'
# Docker 그룹 권한 적용을 위해 재로그인 시뮬레이션
sudo usermod -a -G docker ec2-user
newgrp docker

# Node.js 설정
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
nvm alias default 18

cd /home/ec2-user/soap-ai
npm install
npm run build
EOF

# 6. SSL 인증서 설정
log_info "🔒 SSL 인증서 설정 중..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST << EOF
# Nginx 설정 업데이트
sudo cp /home/ec2-user/soap-ai/deployment/nginx/default.conf /etc/nginx/conf.d/
sudo sed -i 's/your-domain.com/$DOMAIN/g' /etc/nginx/conf.d/default.conf

# Let's Encrypt SSL 인증서 발급
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl enable nginx
EOF

# 7. Docker 컨테이너 실행
log_info "🚀 Docker 컨테이너 실행 중..."
ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST << 'EOF'
cd /home/ec2-user/soap-ai
docker-compose -f deployment/docker/docker-compose.yml up -d --build

# 컨테이너 상태 확인
sleep 10
docker-compose -f deployment/docker/docker-compose.yml ps
EOF

# 8. 헬스체크
log_info "🔍 배포 헬스체크 중..."
sleep 20

for i in {1..5}; do
    if curl -f https://$DOMAIN/health > /dev/null 2>&1; then
        log_info "✅ HTTPS 배포 성공!"
        break
    elif curl -f http://$EC2_HOST/health > /dev/null 2>&1; then
        log_info "✅ HTTP 배포 성공!"
        break
    fi
    log_warn "헬스체크 재시도 ($i/5)..."
    sleep 10
done

# 9. 배포 완료 정보 출력
log_info "🎉 SOAP AI 배포 완료!"
echo ""
echo "📱 접속 URL:"
echo "  - HTTPS: https://$DOMAIN"
echo "  - HTTP: http://$EC2_HOST"
echo ""
echo "🔧 관리 명령어:"
echo "  - 로그 확인: ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST 'docker-compose -f /home/ec2-user/soap-ai/deployment/docker/docker-compose.yml logs'"
echo "  - 재시작: ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST '/home/ec2-user/soap-ai/deployment/scripts/deploy.sh'"
echo "  - 백업: ssh -i $SSH_KEY_PATH $EC2_USER@$EC2_HOST '/home/ec2-user/soap-ai/deployment/scripts/backup.sh'"
echo ""
log_info "배포 프로세스 완료!"
EOF