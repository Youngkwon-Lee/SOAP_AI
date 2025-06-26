#!/bin/bash

echo "🔍 SOAP_AI 보안 테스트 스크립트"
echo "================================"

# 1. 환경 변수 검사
echo "1. 환경 변수 보안 검사..."
if grep -r "REACT_APP_OPENAI_API_KEY" src/; then
    echo "❌ 클라이언트 코드에서 OpenAI API 키 발견!"
else
    echo "✅ 클라이언트에서 OpenAI API 키 없음"
fi

if grep -r "REACT_APP_PINECONE_API_KEY" src/; then
    echo "❌ 클라이언트 코드에서 Pinecone API 키 발견!"
else
    echo "✅ 클라이언트에서 Pinecone API 키 없음"
fi

# 2. 인증 체크 확인
echo -e "\n2. 인증 로직 검사..."
if grep -r "false &&" src/components/PrivateRoute.tsx; then
    echo "❌ PrivateRoute에 인증 우회 코드 발견!"
else
    echo "✅ PrivateRoute 인증 체크 활성화됨"
fi

# 3. Firebase Functions 설정 확인
echo -e "\n3. Firebase Functions 설정 확인..."
if [ -f "functions/lib/index.js" ]; then
    echo "✅ Firebase Functions 빌드됨"
else
    echo "⚠️ Firebase Functions 빌드 필요: cd functions && npm run build"
fi

# 4. .gitignore 확인
echo -e "\n4. .gitignore 보안 검사..."
if grep -q "\.env" .gitignore; then
    echo "✅ .env 파일이 .gitignore에 포함됨"
else
    echo "❌ .env 파일을 .gitignore에 추가해야 함"
fi

# 5. Firebase 프로젝트 연결 확인
echo -e "\n5. Firebase 프로젝트 연결 상태..."
if firebase projects:list &>/dev/null; then
    echo "✅ Firebase CLI 로그인됨"
    echo "현재 프로젝트: $(firebase use 2>/dev/null | grep 'active' | cut -d' ' -f4 || echo '설정되지 않음')"
else
    echo "⚠️ Firebase CLI 로그인 필요: firebase login"
fi

echo -e "\n📋 다음 단계:"
echo "1. 새로운 API 키 발급 후 Firebase Functions에 설정"
echo "2. firebase deploy --only functions"
echo "3. npm start로 클라이언트 테스트"
echo "4. 미인증 상태로 보호된 페이지 접근 시도"

echo -e "\n🔧 수동 테스트 항목:"
echo "- 로그아웃 상태에서 /soap-note 접근 → /auth 리다이렉트"
echo "- 로그인 후 SOAP 노트 생성 시도"
echo "- 네트워크 탭에서 API 키 노출 여부 확인"
echo "- Firebase Functions 로그 확인"