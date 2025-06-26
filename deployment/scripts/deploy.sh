#!/bin/bash

# SOAP AI EC2 배포 스크립트
set -e

echo "🚀 SOAP AI 배포 시작..."

# 환경 변수 설정
export NODE_ENV=production
export COMPOSE_PROJECT_NAME=soap-ai

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 프로젝트 루트로 이동
cd "$(dirname "$0")/../.."

# 1. Git 최신 코드 가져오기
log_info "Git 코드 업데이트 중..."
git pull origin main

# 2. 의존성 설치 및 빌드
log_info "의존성 설치 및 프로덕션 빌드 중..."
npm ci --only=production
npm run build

# 3. Docker 이미지 빌드
log_info "Docker 이미지 빌드 중..."
docker-compose -f deployment/docker/docker-compose.yml build --no-cache

# 4. 기존 컨테이너 중지 및 제거
log_info "기존 컨테이너 중지 중..."
docker-compose -f deployment/docker/docker-compose.yml down

# 5. 새 컨테이너 시작
log_info "새 컨테이너 시작 중..."
docker-compose -f deployment/docker/docker-compose.yml up -d

# 6. 헬스체크
log_info "헬스체크 진행 중..."
sleep 10

for i in {1..5}; do
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_info "✅ 배포 성공! 애플리케이션이 정상적으로 실행 중입니다."
        exit 0
    fi
    log_warn "헬스체크 재시도 ($i/5)..."
    sleep 5
done

log_error "❌ 배포 실패! 헬스체크를 통과하지 못했습니다."
docker-compose -f deployment/docker/docker-compose.yml logs
exit 1