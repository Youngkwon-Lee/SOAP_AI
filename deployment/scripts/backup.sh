#!/bin/bash

# SOAP AI 데이터 백업 스크립트
set -e

# 설정
BACKUP_DIR="/home/ec2-user/soap-ai/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="soap-ai-backup-$DATE"
S3_BUCKET="${BACKUP_S3_BUCKET:-soap-ai-backup}"
RETENTION_DAYS=30

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

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

log_info "🗂️ SOAP AI 백업 시작: $BACKUP_NAME"

# 1. Docker 볼륨 백업
log_info "📦 Docker 볼륨 백업 중..."
cd /home/ec2-user/soap-ai

# 데이터베이스 볼륨 백업 (있는 경우)
if docker volume ls | grep -q soap-ai_db_data; then
    docker run --rm \
        -v soap-ai_db_data:/data \
        -v "$BACKUP_DIR":/backup \
        alpine tar czf /backup/${BACKUP_NAME}_db_data.tar.gz -C /data .
    log_info "✅ 데이터베이스 볼륨 백업 완료"
fi

# Redis 볼륨 백업 (있는 경우)
if docker volume ls | grep -q soap-ai_redis_data; then
    docker run --rm \
        -v soap-ai_redis_data:/data \
        -v "$BACKUP_DIR":/backup \
        alpine tar czf /backup/${BACKUP_NAME}_redis_data.tar.gz -C /data .
    log_info "✅ Redis 볼륨 백업 완료"
fi

# 2. 애플리케이션 로그 백업
log_info "📋 애플리케이션 로그 백업 중..."
if [ -d "/home/ec2-user/soap-ai/logs" ]; then
    tar czf "$BACKUP_DIR/${BACKUP_NAME}_logs.tar.gz" -C /home/ec2-user/soap-ai logs/
    log_info "✅ 로그 백업 완료"
fi

# 3. 설정 파일 백업
log_info "⚙️ 설정 파일 백업 중..."
tar czf "$BACKUP_DIR/${BACKUP_NAME}_config.tar.gz" \
    -C /home/ec2-user/soap-ai \
    deployment/ \
    .env \
    --exclude=deployment/terraform/.terraform \
    --exclude=deployment/terraform/terraform.tfstate \
    2>/dev/null || log_warn "일부 설정 파일을 찾을 수 없습니다"

# 4. SSL 인증서 백업 (있는 경우)
log_info "🔒 SSL 인증서 백업 중..."
if [ -d "/etc/letsencrypt" ]; then
    sudo tar czf "$BACKUP_DIR/${BACKUP_NAME}_ssl.tar.gz" -C /etc letsencrypt/
    sudo chown ec2-user:ec2-user "$BACKUP_DIR/${BACKUP_NAME}_ssl.tar.gz"
    log_info "✅ SSL 인증서 백업 완료"
fi

# 5. 시스템 정보 백업
log_info "🖥️ 시스템 정보 백업 중..."
cat > "$BACKUP_DIR/${BACKUP_NAME}_system_info.txt" << EOF
=== SOAP AI 시스템 백업 정보 ===
백업 날짜: $(date)
서버 호스트명: $(hostname)
운영체제: $(cat /etc/os-release | grep PRETTY_NAME)
커널 버전: $(uname -r)
Docker 버전: $(docker --version)
Docker Compose 버전: $(docker-compose --version)

=== 실행 중인 컨테이너 ===
$(docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}")

=== Docker 볼륨 ===
$(docker volume ls)

=== 디스크 사용량 ===
$(df -h)

=== 메모리 사용량 ===
$(free -h)

=== 네트워크 설정 ===
$(ip addr show)

=== 프로세스 상태 ===
$(ps aux --sort=-%cpu | head -20)
EOF

# 6. 백업 압축
log_info "🗜️ 전체 백업 압축 중..."
cd "$BACKUP_DIR"
tar czf "${BACKUP_NAME}_complete.tar.gz" ${BACKUP_NAME}_*
rm -f ${BACKUP_NAME}_*.tar.gz ${BACKUP_NAME}_*.txt
log_info "✅ 백업 압축 완료: ${BACKUP_NAME}_complete.tar.gz"

# 7. S3 업로드 (AWS CLI 사용 가능한 경우)
if command -v aws &> /dev/null; then
    log_info "☁️ S3에 백업 업로드 중..."
    if aws s3 cp "${BACKUP_NAME}_complete.tar.gz" "s3://$S3_BUCKET/backups/" 2>/dev/null; then
        log_info "✅ S3 업로드 완료: s3://$S3_BUCKET/backups/${BACKUP_NAME}_complete.tar.gz"
        
        # 로컬 백업 파일 삭제 (S3 업로드 성공 시)
        rm -f "${BACKUP_NAME}_complete.tar.gz"
        log_info "🗑️ 로컬 백업 파일 정리 완료"
    else
        log_warn "S3 업로드 실패. 로컬 백업 파일 유지: ${BACKUP_NAME}_complete.tar.gz"
    fi
else
    log_warn "AWS CLI가 설치되지 않음. 로컬 백업만 수행됨"
fi

# 8. 오래된 백업 정리
log_info "🧹 오래된 백업 정리 중..."

# 로컬 백업 정리
find "$BACKUP_DIR" -name "soap-ai-backup-*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# S3 백업 정리 (AWS CLI 사용 가능한 경우)
if command -v aws &> /dev/null; then
    aws s3 ls "s3://$S3_BUCKET/backups/" 2>/dev/null | \
    awk '{print $4}' | \
    grep "soap-ai-backup-" | \
    sort -r | \
    tail -n +$((RETENTION_DAYS + 1)) | \
    while read file; do
        aws s3 rm "s3://$S3_BUCKET/backups/$file" 2>/dev/null && \
        log_info "🗑️ S3에서 오래된 백업 삭제: $file"
    done 2>/dev/null || true
fi

# 9. 백업 완료 알림
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz" 2>/dev/null | cut -f1 || echo "알 수 없음")
log_info "✅ 백업 완료!"
log_info "백업 이름: $BACKUP_NAME"
log_info "백업 크기: $BACKUP_SIZE"
log_info "백업 위치: $BACKUP_DIR"

# 10. 백업 검증
log_info "🔍 백업 무결성 검증 중..."
if [ -f "$BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz" ]; then
    if tar tzf "$BACKUP_DIR/${BACKUP_NAME}_complete.tar.gz" >/dev/null 2>&1; then
        log_info "✅ 백업 파일 무결성 확인됨"
    else
        log_error "❌ 백업 파일 손상됨"
        exit 1
    fi
fi

# 11. 복구 가이드 생성
cat > "$BACKUP_DIR/restore_guide_${DATE}.txt" << EOF
=== SOAP AI 백업 복구 가이드 ===
생성 날짜: $(date)
백업 파일: ${BACKUP_NAME}_complete.tar.gz

복구 단계:
1. 백업 파일 다운로드 (S3에서):
   aws s3 cp s3://$S3_BUCKET/backups/${BACKUP_NAME}_complete.tar.gz ./

2. 백업 파일 압축 해제:
   tar xzf ${BACKUP_NAME}_complete.tar.gz

3. Docker 볼륨 복구:
   docker volume create soap-ai_db_data
   docker run --rm -v soap-ai_db_data:/data -v \$PWD:/backup alpine tar xzf /backup/${BACKUP_NAME}_db_data.tar.gz -C /data

4. 설정 파일 복구:
   tar xzf ${BACKUP_NAME}_config.tar.gz

5. SSL 인증서 복구 (필요시):
   sudo tar xzf ${BACKUP_NAME}_ssl.tar.gz -C /etc/

6. 애플리케이션 재시작:
   docker-compose -f deployment/docker/docker-compose.yml up -d

주의사항:
- 복구 전 기존 데이터를 백업하세요
- 도메인과 DNS 설정을 확인하세요
- 환경 변수(.env)를 실제 값으로 설정하세요
EOF

log_info "📝 복구 가이드 생성: restore_guide_${DATE}.txt"
log_info "🎉 백업 프로세스 모두 완료!"