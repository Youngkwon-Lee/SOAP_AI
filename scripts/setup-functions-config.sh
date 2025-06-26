#!/bin/bash

# Firebase Functions 환경 변수 설정 스크립트
echo "🔧 Firebase Functions 환경 변수 설정을 시작합니다..."

# 현재 설정 확인
echo "📋 현재 Functions 환경 변수 확인:"
firebase functions:config:get

echo ""
echo "⚠️  다음 단계를 수행해주세요:"
echo ""
echo "1. 새로운 OpenAI API 키를 발급받아주세요:"
echo "   - https://platform.openai.com/api-keys 방문"
echo "   - 새 API 키 생성"
echo ""
echo "2. 새로운 Pinecone API 키를 발급받아주세요:"
echo "   - https://app.pinecone.io 방문"
echo "   - API Keys 섹션에서 새 키 생성"
echo ""
echo "3. 아래 명령어들을 실행하여 환경 변수를 설정해주세요:"
echo ""
echo "firebase functions:config:set openai.key=\"YOUR_NEW_OPENAI_KEY\""
echo "firebase functions:config:set pinecone.key=\"YOUR_NEW_PINECONE_KEY\""
echo "firebase functions:config:set pinecone.environment=\"YOUR_PINECONE_ENV\""
echo ""
echo "4. Functions 재배포:"
echo "firebase deploy --only functions"
echo ""
echo "🔒 보안 참고사항:"
echo "- 이전에 노출된 API 키들은 무효화되어야 합니다"
echo "- 새로운 키들은 절대 클라이언트 코드나 버전 관리에 포함하지 마세요"
echo "- Firebase Functions에서만 관리됩니다"