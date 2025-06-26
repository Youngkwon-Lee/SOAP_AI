#!/bin/bash

# SSH 연결 및 배포 스크립트 (WSL 환경용)
set -e

EC2_HOST="43.201.5.96"
EC2_USER="ec2-user"
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

# Windows의 SSH 클라이언트 사용
log_info "🚀 SOAP AI EC2 배포 시작 (Windows SSH 사용)..."

# PowerShell을 통해 SSH 연결 테스트
log_info "📡 EC2 연결 테스트 중..."
if powershell.exe -Command "ssh -i C:\\Users\\YK\\youngkwon.pem -o ConnectTimeout=10 ec2-user@43.201.5.96 'echo SSH 연결 성공'" 2>/dev/null; then
    log_info "✅ EC2 SSH 연결 성공"
else
    log_error "❌ EC2 SSH 연결 실패"
    echo "PowerShell에서 다음 명령어를 직접 실행해주세요:"
    echo "ssh -i C:\\Users\\YK\\youngkwon.pem ec2-user@43.201.5.96"
    exit 1
fi

log_info "✅ SSH 연결이 확인되었습니다."
echo ""
echo "이제 다음 명령어들을 PowerShell에서 순서대로 실행해주세요:"
echo ""
echo "1. EC2에 연결:"
echo "   ssh -i C:\\Users\\YK\\youngkwon.pem ec2-user@43.201.5.96"
echo ""
echo "2. 시스템 업데이트:"
echo "   sudo yum update -y"
echo ""
echo "3. Docker 설치:"
echo "   sudo yum install -y docker"
echo "   sudo systemctl start docker"
echo "   sudo systemctl enable docker"
echo "   sudo usermod -a -G docker ec2-user"
echo ""
echo "4. Node.js 설치:"
echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
echo "   source ~/.bashrc"
echo "   nvm install 18"
echo "   nvm use 18"
echo ""
echo "5. 프로젝트 클론 (GitHub 저장소 필요):"
echo "   git clone https://github.com/your-username/SOAP_AI.git"
echo "   cd SOAP_AI"
echo ""
echo "또는 수동으로 배포 파일을 업로드하시겠습니까?"