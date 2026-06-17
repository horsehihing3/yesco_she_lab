# 운영 서버 배포 가이드 — Apache + Wildcard SSL

> 대상: `ehs.com4in.com` 운영 서버 (Windows + Apache HTTP Server)
> 구조: **Apache가 정적 React build 서빙 + `/api`만 Spring Boot(7601)로 리버스 프록시**
> ※ Apache+Tomcat AJP(mod_jk) 구조 아님 — Spring Boot 내장 Tomcat을 mod_proxy로 프록시한다.

```
사용자 ─HTTPS(443)─▶ Apache
                      ├─ /          → 정적 React build (DocumentRoot)
                      └─ /api/...   → reverse proxy → http://localhost:7601
HTTP(80) → HTTPS 리다이렉트
```

---

## 0. 준비물 (사전 확보)

- [ ] 와일드카드 인증서 `*.com4in.com` : `.pfx` 또는 (`server.crt` + `private.key` + `ca_bundle.crt`)
- [ ] DNS A레코드: `ehs.com4in.com` → 운영 서버 공인 IP
- [ ] 방화벽: 80 / 443 인바운드 오픈
- [ ] 운영 서버에서 Spring Boot(7601) 실행 중

---

## 1. Apache 설치 (운영 서버)

1. Apache Lounge(https://www.apachelounge.com/download/) 에서 Win64 빌드 다운로드
2. `D:\Apache24` 에 압축 해제 (경로 다르면 이하 모든 경로를 맞춰 수정)
3. 관리자 CMD에서 서비스 등록:
   ```bat
   D:\Apache24\bin\httpd.exe -k install
   ```

> Visual C++ Redistributable(x64)이 없으면 httpd 실행이 안 됨 → Apache Lounge 페이지의 VS 재배포 패키지 먼저 설치.

---

## 2. 인증서 준비

### 2-A. pfx만 있는 경우 → PEM 변환 (OpenSSL 필요)

Win64 OpenSSL(https://slproweb.com/products/Win32OpenSSL.html) 설치 후:

```bat
REM 인증서(서버 + 체인)
openssl pkcs12 -in wildcard_com4in_com.pfx -clcerts -nokeys -out server.crt
REM 개인키 (암호 없이)
openssl pkcs12 -in wildcard_com4in_com.pfx -nocerts -nodes -out private.key
REM 중간 인증서(체인)
openssl pkcs12 -in wildcard_com4in_com.pfx -cacerts -nokeys -nodes -out ca_bundle.crt
```

### 2-B. crt/key를 따로 받은 경우
변환 없이 그대로 사용.

### 배치
세 파일을 `D:\Apache24\conf\ssl\` 에 둔다:
```
D:\Apache24\conf\ssl\server.crt
D:\Apache24\conf\ssl\private.key
D:\Apache24\conf\ssl\ca_bundle.crt
```

---

## 3. 프론트엔드 빌드 (개발 PC에서 해도 됨)

1. `frontend/.env.production` 생성 — 운영용으로 **VWorld 도메인만 변경**, 나머지는 `.env`와 동일:
   ```env
   VITE_API_URL=/api

   VITE_MAPBOX_ACCESS_TOKEN=<.env와 동일>
   VITE_GOOGLE_MAPS_API_KEY=<.env와 동일>
   VITE_GOOGLE_MAPS_MAP_ID=<.env와 동일>
   VITE_GEMINI_API_KEY=<.env와 동일>     # ⚠️ 아래 보안 주의 참고
   VITE_VWORLD_API_KEY=<.env와 동일>
   VITE_VWORLD_DOMAIN=ehs.com4in.com      # ★ localhost → 운영 도메인
   VITE_KMA_API_KEY=<.env와 동일>
   ```
2. 빌드:
   ```bash
   cd frontend
   npm install      # 최초 1회
   npm run build    # dist/ 생성
   ```
3. `frontend/dist/` 내용을 운영 서버 `D:\Apache24\htdocs\ehs\` 로 복사.

---

## 4. Apache 설정

### 4-1. 모듈 활성화 — `D:\Apache24\conf\httpd.conf`
아래 라인의 주석(`#`)을 해제:
```apache
LoadModule ssl_module           modules/mod_ssl.so
LoadModule rewrite_module        modules/mod_rewrite.so
LoadModule proxy_module          modules/mod_proxy.so
LoadModule proxy_http_module     modules/mod_proxy_http.so
LoadModule socache_shmcb_module  modules/mod_socache_shmcb.so
```
그리고 파일 하단에 SSL 설정 포함:
```apache
Include conf/extra/httpd-ssl.conf
```

### 4-2. `D:\Apache24\conf\extra\httpd-ssl.conf`
```apache
Listen 443

<VirtualHost *:443>
    ServerName ehs.com4in.com
    DocumentRoot "D:/Apache24/htdocs/ehs"

    SSLEngine on
    SSLCertificateFile      "D:/Apache24/conf/ssl/server.crt"
    SSLCertificateKeyFile   "D:/Apache24/conf/ssl/private.key"
    SSLCertificateChainFile "D:/Apache24/conf/ssl/ca_bundle.crt"

    # /api → Spring Boot(내장 Tomcat)
    ProxyPreserveHost On
    ProxyPass        /api  http://localhost:7601/api
    ProxyPassReverse /api  http://localhost:7601/api

    # SPA 라우팅: 실제 파일/디렉터리 아니고 /api 도 아니면 index.html
    <Directory "D:/Apache24/htdocs/ehs">
        Require all granted
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/api/
        RewriteRule . /index.html [L]
    </Directory>

    ErrorLog  "logs/ehs-ssl-error.log"
    CustomLog "logs/ehs-ssl-access.log" common
</VirtualHost>
```

### 4-3. HTTP → HTTPS 리다이렉트 — `httpd.conf` 하단 또는 별도 vhost
```apache
<VirtualHost *:80>
    ServerName ehs.com4in.com
    Redirect permanent / https://ehs.com4in.com/
</VirtualHost>
```

---

## 5. 검증 & 기동

```bat
REM 문법 검사 — "Syntax OK" 떠야 함
D:\Apache24\bin\httpd.exe -t

REM 서비스 기동/재시작
net stop Apache2.4
net start Apache2.4
```

브라우저: `https://ehs.com4in.com` 접속 → 자물쇠(유효 인증서) 확인 → 로그인 →
개발자도구 Network에서 `/api/...` 요청이 200으로 돌아오는지 확인.

문제 시 `D:\Apache24\logs\ehs-ssl-error.log` 확인.

---

## ⚠️ 보안 주의 (납품 전 검토)

1. **`VITE_*` 키는 빌드 시 클라이언트 번들에 그대로 노출됨.** 특히 `VITE_GEMINI_API_KEY`는
   브라우저에서 추출해 과금 악용 가능 → Gemini 호출은 백엔드 프록시로 이전 권장.
2. **CORS**: 프론트와 API가 같은 도메인(`ehs.com4in.com`, `/api`)이므로 CORS 불필요.
   별도 `api.com4in.com` 으로 분리할 경우 Spring Boot CORS 허용 도메인 추가 필요.
3. **인증서 갱신**: OV 와일드카드 만료일 캘린더 등록. 갱신 시 2~5단계 인증서 파일만 교체 후 재시작.

---

## 와일드카드 적용 범위
`*.com4in.com` 인증서 하나로 다음 모두 커버:
`ehs.com4in.com` · `api.com4in.com` · `mobile.com4in.com` · `dev.com4in.com` …
(각 서브도메인마다 `<VirtualHost>` 블록만 추가하면 됨)
