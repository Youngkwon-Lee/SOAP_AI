// SOAP AI Service Worker - 오프라인 기능 지원
const CACHE_NAME = 'soap-ai-v1';
const STATIC_CACHE_NAME = 'soap-ai-static-v1';
const DYNAMIC_CACHE_NAME = 'soap-ai-dynamic-v1';

// 캐시할 정적 자원 목록
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// 오프라인에서 캐시할 페이지들
const OFFLINE_PAGES = [
  '/',
  '/unified-soap-note',
  '/all-notes',
  '/auth'
];

// 설치 이벤트 - 정적 자원 캐시
self.addEventListener('install', (event) => {
  console.log('🔧 서비스 워커 설치 중...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 정적 자원 캐시 중...');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('❌ 정적 자원 캐시 실패:', error);
      })
  );
  self.skipWaiting(); // 즉시 활성화
});

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('✅ 서비스 워커 활성화됨');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('🗑️ 오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // 모든 클라이언트 즉시 제어
});

// Fetch 이벤트 - 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chrome extension 요청 무시
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API 요청 처리
  if (url.pathname.includes('/api/') || url.hostname.includes('firestore') || url.hostname.includes('openai')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 정적 자원 및 페이지 요청 처리
  event.respondWith(handleStaticRequest(request));
});

// API 요청 처리 (네트워크 우선, 실패 시 캐시)
async function handleApiRequest(request) {
  try {
    // 네트워크 요청 시도
    const networkResponse = await fetch(request);
    
    // 성공하면 응답을 캐시하고 반환
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('네트워크 응답 실패');
  } catch (error) {
    console.log('🔄 네트워크 실패, 캐시에서 찾는 중...', request.url);
    
    // 캐시에서 찾기
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // OpenAI API 요청이 실패한 경우 오프라인 메시지 반환
    if (request.url.includes('openai')) {
      return new Response(
        JSON.stringify({
          error: '현재 오프라인 상태입니다. 인터넷 연결을 확인해주세요.',
          offline: true
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// 정적 자원 요청 처리 (캐시 우선, 실패 시 네트워크)
async function handleStaticRequest(request) {
  try {
    // 캐시에서 먼저 찾기
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 캐시에 없으면 네트워크 요청
    const networkResponse = await fetch(request);
    
    // 성공하면 캐시에 저장
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 네트워크 실패, 오프라인 페이지 제공');
    
    // HTML 페이지 요청이고 오프라인인 경우
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // 기본 오프라인 응답
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>오프라인 - SOAP AI</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              color: #1e293b;
            }
            .offline-container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              max-width: 400px;
            }
            .offline-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            h1 {
              color: #3b82f6;
              margin-bottom: 1rem;
            }
            p {
              color: #64748b;
              line-height: 1.6;
            }
            .retry-btn {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 1rem;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>오프라인 모드</h1>
            <p>현재 인터넷에 연결되어 있지 않습니다.<br>
            일부 기능이 제한될 수 있습니다.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              다시 시도
            </button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// 백그라운드 동기화 (향후 확장용)
self.addEventListener('sync', (event) => {
  console.log('🔄 백그라운드 동기화:', event.tag);
  
  if (event.tag === 'background-sync-notes') {
    event.waitUntil(syncOfflineNotes());
  }
});

// 오프라인 노트 동기화 함수
async function syncOfflineNotes() {
  try {
    // localStorage에서 오프라인 노트 가져오기
    const offlineNotes = JSON.parse(localStorage.getItem('offline-notes') || '[]');
    
    if (offlineNotes.length === 0) return;
    
    console.log('📤 오프라인 노트 동기화 중...', offlineNotes.length);
    
    // TODO: Firebase에 오프라인 노트 업로드
    // for (const note of offlineNotes) {
    //   await uploadNoteToFirebase(note);
    // }
    
    // 동기화 완료 후 로컬 스토리지에서 제거
    localStorage.removeItem('offline-notes');
    console.log('✅ 오프라인 노트 동기화 완료');
    
  } catch (error) {
    console.error('❌ 오프라인 노트 동기화 실패:', error);
  }
}

// 푸시 알림 (향후 확장용)
self.addEventListener('push', (event) => {
  console.log('📨 푸시 알림 수신');
  
  const options = {
    body: event.data ? event.data.text() : 'SOAP AI에서 새로운 알림이 있습니다.',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('SOAP AI', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 알림 클릭됨:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🚀 SOAP AI 서비스 워커 로드됨');