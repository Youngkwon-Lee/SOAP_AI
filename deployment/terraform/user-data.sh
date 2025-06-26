#!/bin/bash

# EC2 User Data 스크립트 - 인스턴스 시작 시 자동 실행
set -e

# 로그 설정
exec > >(tee /var/log/user-data.log) 2>&1
date

echo "🚀 SOAP AI EC2 인스턴스 자동 설정 시작..."

# 1. 시스템 업데이트
echo "📦 시스템 패키지 업데이트..."
yum update -y

# 2. 필수 패키지 설치
echo "🔧 필수 패키지 설치..."
yum install -y git curl wget nano htop docker

# 3. Docker 시작 및 활성화
echo "🐳 Docker 서비스 시작..."
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# 4. Docker Compose 설치
echo "🐙 Docker Compose 설치..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# 5. Node.js 설치 (NVM 사용)
echo "🟢 Node.js 설치..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | sudo -u ec2-user bash
sudo -u ec2-user bash -c 'source ~/.bashrc && nvm install 18 && nvm use 18 && nvm alias default 18'

# 6. Nginx 설치 (백업용)
echo "🌐 Nginx 설치..."
amazon-linux-extras install -y nginx1
systemctl enable nginx

# 7. Let's Encrypt 설치
echo "🔒 Certbot 설치..."
yum install -y python3-pip
pip3 install certbot certbot-nginx

# 8. CloudWatch 에이전트 설치
echo "📊 CloudWatch 에이전트 설치..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# CloudWatch 에이전트 설정
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "metrics": {
        "namespace": "SOAP-AI/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "diskio": {
                "measurement": ["io_time"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/user-data.log",
                        "log_group_name": "soap-ai-ec2",
                        "log_stream_name": "{instance_id}/user-data"
                    },
                    {
                        "file_path": "/home/ec2-user/soap-ai/logs/*.log",
                        "log_group_name": "soap-ai-application",
                        "log_stream_name": "{instance_id}/app"
                    }
                ]
            }
        }
    }
}
EOF

# CloudWatch 에이전트 시작
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# 9. 스왑 파일 생성 (메모리 최적화)
echo "💾 스왑 파일 생성..."
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 10. 방화벽 설정
echo "🔥 방화벽 설정..."
yum install -y iptables-services
iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp --dport 443 -j ACCEPT
iptables -I INPUT -p tcp --dport 22 -j ACCEPT
service iptables save

# 11. 프로젝트 디렉토리 생성
echo "📁 프로젝트 디렉토리 생성..."
mkdir -p /home/ec2-user/soap-ai/{logs,ssl,backups}
chown -R ec2-user:ec2-user /home/ec2-user/soap-ai

# 12. 환경 변수 설정
echo "⚙️ 환경 변수 설정..."
cat >> /home/ec2-user/.bashrc << 'EOF'

# SOAP AI 환경 변수
export SOAP_AI_HOME=/home/ec2-user/soap-ai
export NODE_ENV=production
export PATH=$PATH:$SOAP_AI_HOME/deployment/scripts
EOF

# 13. 로그 로테이션 설정
echo "📋 로그 로테이션 설정..."
cat > /etc/logrotate.d/soap-ai << 'EOF'
/home/ec2-user/soap-ai/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ec2-user ec2-user
    postrotate
        /usr/bin/docker kill -s USR1 soap-ai-app 2>/dev/null || true
    endscript
}
EOF

# 14. 시스템 서비스 등록
echo "🔧 시스템 서비스 등록..."
cat > /etc/systemd/system/soap-ai.service << 'EOF'
[Unit]
Description=SOAP AI Application
Requires=docker.service
After=docker.service network.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/soap-ai
ExecStart=/usr/local/bin/docker-compose -f deployment/docker/docker-compose.yml up -d
ExecStop=/usr/local/bin/docker-compose -f deployment/docker/docker-compose.yml down
User=ec2-user
Group=ec2-user

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable soap-ai

# 15. 모니터링 및 알림 설정
echo "📊 모니터링 스크립트 설정..."
cat > /home/ec2-user/soap-ai/monitor.sh << 'EOF'
#!/bin/bash
# SOAP AI 헬스 모니터링 스크립트

HEALTH_URL="http://localhost/health"
LOG_FILE="/home/ec2-user/soap-ai/logs/monitor.log"

check_health() {
    if curl -f $HEALTH_URL > /dev/null 2>&1; then
        echo "$(date): ✅ SOAP AI is healthy" >> $LOG_FILE
        return 0
    else
        echo "$(date): ❌ SOAP AI is down" >> $LOG_FILE
        return 1
    fi
}

# 헬스체크 실패 시 재시작 시도
if ! check_health; then
    echo "$(date): 🔄 Attempting to restart SOAP AI..." >> $LOG_FILE
    cd /home/ec2-user/soap-ai
    docker-compose -f deployment/docker/docker-compose.yml restart
    sleep 30
    
    if check_health; then
        echo "$(date): ✅ SOAP AI restarted successfully" >> $LOG_FILE
    else
        echo "$(date): ❌ SOAP AI restart failed" >> $LOG_FILE
        # SNS 알림 전송 (AWS CLI 필요)
        # aws sns publish --topic-arn "arn:aws:sns:region:account:soap-ai-alerts" --message "SOAP AI restart failed"
    fi
fi
EOF

chmod +x /home/ec2-user/soap-ai/monitor.sh
chown ec2-user:ec2-user /home/ec2-user/soap-ai/monitor.sh

# 16. Cron 작업 설정
echo "⏰ Cron 작업 설정..."
sudo -u ec2-user crontab << 'EOF'
# SOAP AI 모니터링 (5분마다)
*/5 * * * * /home/ec2-user/soap-ai/monitor.sh

# SSL 인증서 자동 갱신 확인 (매일 새벽 2시)
0 2 * * * /usr/bin/certbot renew --quiet

# 로그 정리 (주간, 일요일 새벽 3시)
0 3 * * 0 find /home/ec2-user/soap-ai/logs -name "*.log" -mtime +30 -delete

# Docker 시스템 정리 (월간, 1일 새벽 4시)
0 4 1 * * /usr/bin/docker system prune -f
EOF

# 17. 보안 강화
echo "🔒 보안 설정 강화..."
# SSH 설정 강화
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# 18. 완료 알림
echo "✅ EC2 인스턴스 자동 설정 완료!"
echo "$(date): EC2 User Data script completed successfully" >> /var/log/user-data.log

# 인스턴스 메타데이터에 설정 완료 표시
curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null | \
xargs -I {} curl -H "X-aws-ec2-metadata-token: {}" http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null | \
xargs -I {} aws ec2 create-tags --resources {} --tags Key=SetupStatus,Value=Completed --region ap-northeast-2 2>/dev/null || true

echo "🎉 SOAP AI EC2 인스턴스가 성공적으로 설정되었습니다!"
echo "다음 단계: 프로젝트 코드 클론 및 첫 배포 실행"