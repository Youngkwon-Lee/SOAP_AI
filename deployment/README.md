# 🚀 SOAP AI EC2 배포 가이드

EC2에서 SOAP AI 애플리케이션을 배포하기 위한 완전한 가이드입니다.

## 📁 폴더 구조

```
deployment/
├── docker/
│   ├── Dockerfile              # 프로덕션용 Docker 이미지
│   └── docker-compose.yml      # 컨테이너 오케스트레이션
├── nginx/
│   └── default.conf            # Nginx 설정 (PWA, SPA 지원)
├── scripts/
│   ├── setup-ec2.sh           # EC2 초기 설정 스크립트
│   └── deploy.sh              # 자동 배포 스크립트
├── .env.production            # 프로덕션 환경 변수
└── README.md                  # 이 파일
```

## 🚀 EC2 배포 단계

### 1. EC2 인스턴스 준비

1. **EC2 인스턴스 생성**
   - AMI: Amazon Linux 2
   - 인스턴스 타입: t3.medium 이상 권장
   - 보안 그룹: HTTP(80), HTTPS(443), SSH(22) 포트 열기

2. **초기 설정 실행**
```bash
# EC2 인스턴스에 SSH 접속 후
wget https://raw.githubusercontent.com/your-repo/soap-ai/main/deployment/scripts/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

### 2. 프로젝트 클론 및 설정

```bash
# 프로젝트 클론
cd /home/ec2-user
git clone https://github.com/your-repo/soap-ai.git
cd soap-ai

# 환경 변수 설정
cp deployment/.env.production .env
nano .env  # 실제 값으로 수정
```

### 3. 도메인 및 SSL 설정

```bash
# 도메인 DNS A 레코드를 EC2 퍼블릭 IP로 설정 후
sudo certbot --nginx -d your-domain.com
```

### 4. 첫 배포 실행

```bash
chmod +x deployment/scripts/deploy.sh
./deployment/scripts/deploy.sh
```

## 🔧 GitHub Actions CI/CD 설정

### Repository Secrets 설정

다음 Secrets를 GitHub 저장소에 설정하세요:

```
AWS_ACCESS_KEY_ID          # AWS 액세스 키
AWS_SECRET_ACCESS_KEY      # AWS 시크릿 키
EC2_HOST                   # EC2 퍼블릭 IP 또는 도메인
EC2_USERNAME               # ec2-user
EC2_SSH_KEY                # EC2 SSH 프라이빗 키
SLACK_WEBHOOK              # (선택) Slack 알림용
```

### SSH 키 생성 및 설정

```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 퍼블릭 키를 EC2에 추가
cat ~/.ssh/id_rsa.pub | ssh ec2-user@your-ec2-ip 'cat >> ~/.ssh/authorized_keys'

# 프라이빗 키를 GitHub Secrets에 추가 (EC2_SSH_KEY)
cat ~/.ssh/id_rsa
```

## 🐳 Docker 구성

### 멀티 스테이지 빌드
- **Stage 1**: Node.js 빌드 환경에서 React 앱 빌드
- **Stage 2**: Nginx에서 정적 파일 서빙

### 컨테이너 구성
- **soap-ai-app**: 메인 애플리케이션
- **redis**: 캐싱 (선택)
- **nginx-proxy-manager**: SSL 및 도메인 관리 (선택)

## 🔄 자동 배포 프로세스

1. **트리거**: `main` 브랜치에 push
2. **테스트**: npm test 실행
3. **빌드**: React 앱 빌드
4. **배포**: EC2에 SSH 접속하여 deploy.sh 실행
5. **헬스체크**: 배포 성공 확인
6. **알림**: Slack 통지 (선택)

## 📊 모니터링 및 로깅

### 헬스체크
```bash
curl http://your-domain.com/health
```

### 로그 확인
```bash
# 컨테이너 로그
docker-compose -f deployment/docker/docker-compose.yml logs

# Nginx 로그
docker exec soap-ai-app tail -f /var/log/nginx/access.log
```

### 성능 모니터링
- Docker stats: `docker stats`
- 시스템 리소스: `htop`

## 🔧 트러블슈팅

### 일반적인 문제들

1. **Docker 권한 오류**
```bash
sudo usermod -a -G docker ec2-user
# 재로그인 필요
```

2. **메모리 부족**
```bash
# 스왑 파일 확인
free -h
```

3. **포트 충돌**
```bash
# 사용 중인 포트 확인
sudo netstat -tlnp | grep :80
```

### 배포 롤백
```bash
# 이전 버전으로 롤백
git reset --hard HEAD~1
./deployment/scripts/deploy.sh
```

## 🔒 보안 설정

### 방화벽
- SSH: 22번 포트 (특정 IP만 허용 권장)
- HTTP: 80번 포트
- HTTPS: 443번 포트

### SSL/TLS
- Let's Encrypt 자동 갱신
- HTTPS 리다이렉트
- HSTS 헤더

### 환경 변수 보안
- 프로덕션 환경 변수는 EC2에서만 설정
- GitHub에 민감 정보 커밋 금지

## 📈 확장성 고려사항

### 수평 확장
- 로드 밸런서 앞에 여러 EC2 인스턴스
- RDS 또는 외부 데이터베이스 사용

### 성능 최적화
- CloudFront CDN 사용
- Redis 캐싱 활용
- 이미지 최적화

## 💰 비용 최적화

- Spot 인스턴스 사용 고려
- CloudWatch 모니터링으로 리소스 사용량 추적
- S3 정적 호스팅 + CloudFront 대안 검토

---

**문의사항이나 이슈가 있으시면 GitHub Issues에 등록해 주세요.**