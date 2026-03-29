# GTT - Global Theme Tracer

AI 기반 글로벌 뉴스 분석 및 투자 테마 추적 서비스.
매일 글로벌 뉴스를 수집하고, AI가 심층 분석하여 유망 투자 테마와 관련 종목을 추천합니다.

## Architecture

```
stock_report/
├── apps/
│   ├── backend/          # NestJS API 서버 (port 4000)
│   └── frontend/         # Next.js 14 프론트엔드 (port 3000)
└── packages/
    └── shared/           # 공유 TypeScript 타입
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS v4 |
| Backend | NestJS, TypeScript |
| Auth | Supabase Auth |
| AI | OpenAI GPT-5.4 |
| News | NewsAPI |
| Stock Data | Finnhub (profile, quote), Alpha Vantage (daily candle) |
| Monorepo | pnpm workspaces |

## Analysis Pipeline

뉴스 수집부터 종목 추천까지 4단계 파이프라인으로 동작합니다.

```
Step 1: 뉴스 수집 + AI 테마 추출
  NewsAPI에서 글로벌 뉴스 수집 → OpenAI가 테마 추출 + 관련 종목 심볼 추천

Step 2: 실시간 시세 조회 (병렬)
  Finnhub API로 추천 종목의 회사 프로필 + 실시간 시세를 병렬 조회

Step 3-4: AI 분석 + 캔들 데이터 (동시 실행)
  ┌─ OpenAI: 실제 시세 기반 가격 타겟 산출 (Low/Base/High)
  ├─ OpenAI: 인과관계 기반 종목 추천 (뉴스 이벤트 → 시장 영향 → 매매 전략)
  └─ Alpha Vantage: 30일 일봉 차트 데이터 (실패해도 다른 작업에 영향 없음)
```

## Features

### Dashboard Tabs

| Tab | Description |
|-----|-------------|
| **Overview** | 일일 요약, 상위 테마, 키 인사이트, 카테고리 분포, 트렌딩 키워드 |
| **Themes** | 추출된 투자 테마 상세 (신뢰도, 리스크, 기회, 관련 키워드, 관련 종목) |
| **Related Stocks** | 테마별 관련 종목 + 30일 일봉 차트 + AI 가격 타겟 |
| **Recommended** | 인과관계 기반 AI 종목/ETF 추천 (Trigger → Impact → Recommendation) |
| **News Feed** | 수집된 뉴스 기사 목록, 카테고리 필터, 클릭 시 상세 모달 |
| **Report** | 전체 분석 리포트 (한국어/영어) |

### Recommended Stocks (AI Picks)

뉴스 이벤트에서 인과 체인을 분석하여 종목을 추천합니다:

```
이란 군사 행동 → 원유 공급 차질 우려 → 유가 상승 → USO (ETF) 매수 추천
AI 칩 수출 규제 → 중국 반도체 자체 개발 가속 → SMIC 주가 영향 → SMH (ETF)
```

- Bullish / Bearish 방향 제시
- Short / Medium / Long 투자 시계
- 신뢰도 점수

### Scheduled Jobs

| Schedule | Task |
|----------|------|
| 매일 07:00 | 전체 분석 파이프라인 실행 (뉴스 수집 + AI 분석 + 종목 추천) |
| 6시간마다 | 뉴스 수집만 실행 |

## Setup

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

`apps/backend/.env` 파일을 생성하고 다음 값을 설정합니다:

```bash
cp apps/backend/.env.example apps/backend/.env
```

```env
# Server
NODE_ENV=development
BACKEND_PORT=4000

# Supabase (https://supabase.com)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
SUPABASE_JWT_SIGNING_KEY=your-jwt-signing-key

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# OpenAI (https://platform.openai.com/api-keys)
# GPT-5.4를 사용하여 테마 추출, 가격 타겟, 종목 추천을 수행합니다.
OPENAI_API_KEY=sk-proj-...

# NewsAPI (https://newsapi.org/register)
# 글로벌 뉴스 수집에 사용됩니다. 무료 플랜: 100건/일
NEWSAPI_KEY=your-newsapi-key

# Finnhub (https://finnhub.io/register)
# 실시간 시세 및 회사 프로필 조회. 무료 플랜: 60건/분
FINNHUB_API_KEY=your-finnhub-key

# Alpha Vantage (https://www.alphavantage.co/support/#api-key)
# 일봉 캔들 데이터 조회. 무료 플랜: 25건/일
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
```

프론트엔드도 Supabase 환경변수가 필요합니다:

```bash
# apps/frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. API Key 발급 가이드

| Service | URL | Free Tier |
|---------|-----|-----------|
| OpenAI | https://platform.openai.com/api-keys | Pay-as-you-go |
| NewsAPI | https://newsapi.org/register | 100 requests/day |
| Finnhub | https://finnhub.io/register | 60 calls/min |
| Alpha Vantage | https://www.alphavantage.co/support/#api-key | 25 calls/day |
| Supabase | https://supabase.com/dashboard | Free tier available |

### 4. Run Development

```bash
# 전체 실행 (backend + frontend 동시)
pnpm dev

# 개별 실행
pnpm --filter backend dev     # http://localhost:4000
pnpm --filter frontend dev    # http://localhost:3000
```

### 5. Build

```bash
pnpm build
```

## API Endpoints

### News
| Method | Path | Description |
|--------|------|-------------|
| POST | `/news/collect` | 뉴스 수집 실행 |
| GET | `/news?limit=50&category=technology` | 뉴스 목록 조회 |
| GET | `/news/categories` | 카테고리별 뉴스 수 |

### Analysis
| Method | Path | Description |
|--------|------|-------------|
| POST | `/analysis/run` | 전체 분석 파이프라인 실행 |
| GET | `/analysis/reports` | 분석 리포트 목록 |
| GET | `/analysis/latest` | 최신 리포트 |
| GET | `/analysis/themes` | 현재 테마 목록 |

### Stocks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/stocks/search?q=nvidia` | 종목 검색 |
| GET | `/stocks/:symbol/profile` | 회사 프로필 |
| GET | `/stocks/:symbol/quote` | 실시간 시세 |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/summary` | 대시보드 전체 데이터 |

## Project Structure

```
apps/backend/src/
├── analysis/          # AI 분석 파이프라인 (OpenAI 연동)
│   ├── analysis.service.ts    # 4단계 파이프라인 (테마/시세/가격타겟/추천)
│   ├── analysis.controller.ts
│   └── analysis.module.ts
├── news/              # 뉴스 수집 (NewsAPI 연동)
│   ├── news.service.ts
│   ├── news.controller.ts
│   └── news.module.ts
├── stocks/            # 주식 데이터 (Finnhub + Alpha Vantage)
│   ├── stocks.service.ts      # 프로필, 시세, 캔들 조회 + 캐시
│   ├── stocks.controller.ts
│   └── stocks.module.ts
├── reports/           # 대시보드 API
├── scheduler/         # Cron 스케줄러 (매일 7시 분석, 6시간마다 뉴스)
├── config/            # 환경변수 설정
└── health/            # 헬스체크

apps/frontend/src/
├── app/
│   ├── (auth)/        # 로그인/회원가입 페이지
│   ├── dashboard/     # GTT 대시보드
│   │   └── GTTDashboard.tsx   # 메인 대시보드 컴포넌트
│   ├── globals.css    # Tailwind v4 테마 설정
│   └── layout.tsx
├── components/
│   └── auth/          # 인증 폼 컴포넌트
└── lib/               # Supabase 클라이언트, API 유틸

packages/shared/src/
└── index.ts           # 공유 TypeScript 타입 (Theme, Stock, Report 등)
```

## Notes

- 모든 데이터는 현재 **인메모리** 저장입니다. 서버 재시작 시 초기화됩니다. 프로덕션에서는 DB 연동이 필요합니다.
- Alpha Vantage 캔들 데이터는 실패해도 다른 분석 작업에 영향을 주지 않습니다 (graceful degradation).
- Finnhub/Alpha Vantage 응답은 캐시됩니다 (프로필: 1시간, 시세: 5분, 캔들: 1시간).
- 프론트엔드 차트는 외부 라이브러리 없이 순수 SVG로 구현되어 있습니다.
