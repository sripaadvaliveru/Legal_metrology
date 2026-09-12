# Smart Legal Metrology Verification System

**SIH26036 — Ministry of Consumer Affairs, Food & Public Distribution**

Online Verification System for Weighing and Measuring Instruments under Legal Metrology.

## Architecture

```
┌──────────────────┐     ┌──────────────────┐
│  React Web App   │     │ React Native App  │
│  (Vite + Tailwind)│     │    (Mobile)       │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         └───────────┬────────────┘
                     │ REST/JSON
         ┌───────────▼────────────┐
         │    Spring Boot         │
         │    Backend             │
         │                        │
         │  Auth · Users · RBAC   │
         │  Instruments · Apps    │
         │  Assignment Engine     │
         │  Inspections · Certs   │
         │  Notifications · Audit │
         └──────┬────────┬───────┘
                │        │
    ┌───────────▼──┐  ┌──▼──────────┐
    │  PostgreSQL  │  │    Redis     │
    └──────────────┘  └─────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Mobile | React Native, Expo, TypeScript, SQLite |
| Backend | Java 21, Spring Boot 3.3, Spring Security, JWT |
| Database | PostgreSQL 16, Redis 7 |
| File Storage | Cloudinary |
| PDF | OpenPDF |
| QR | ZXing |
| CI/CD | GitHub Actions |
| Containers | Docker, Docker Compose |

## Quick Start

### Prerequisites
- Java 21+
- Node.js 18+
- Docker & Docker Compose
- Maven (or use mvnw)

### 1. Start databases
```bash
docker-compose up -d
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start backend
```bash
cd backend
mvn spring-boot:run
```
Backend runs at `http://localhost:8080`
Swagger UI at `http://localhost:8080/swagger-ui.html`

### 4. Start frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`

### 5. Start mobile (optional)
```bash
cd mobile
npm install
npx expo start
```

## Project Structure

```
legal-metrology-system/
├── frontend/              # React web app
│   └── src/
│       ├── modules/       # Role-based dashboards
│       ├── components/    # Shared UI components
│       ├── hooks/         # Custom React hooks
│       ├── services/      # API client
│       └── types/         # TypeScript types
├── mobile/                # React Native LMO app
│   └── src/
│       ├── screens/       # App screens
│       ├── database/      # SQLite offline storage
│       ├── sync/          # Online/offline sync
│       └── services/      # API client
├── backend/               # Spring Boot backend
│   └── src/main/java/com/legalmetrology/
│       ├── entities/      # JPA entities
│       ├── repositories/  # Spring Data repos
│       ├── services/      # Business logic
│       ├── controllers/   # REST controllers
│       ├── security/      # JWT + Spring Security
│       ├── config/        # App configuration
│       ├── dto/           # Request/Response DTOs
│       ├── enums/         # Status/role enums
│       └── exception/     # Error handling
├── ai-service/            # Python FastAPI (optional)
├── docs/                  # Documentation
│   └── api/openapi.yaml   # API contract
├── docker-compose.yml     # PostgreSQL + Redis
└── .github/workflows/     # CI/CD
```

## User Roles

| Role | Dashboard | Access |
|---|---|---|
| BUSINESS | Business Dashboard | Register instruments, apply for verification, track status |
| LMO | LMO Dashboard + Mobile App | Field inspections, measurements, evidence capture |
| GATC | GATC Dashboard | Lab testing, equipment management |
| DISTRICT_OFFICER | Admin Dashboard | District-level oversight |
| STATE_OFFICER | Admin Dashboard | Statewide analytics |
| SUPER_ADMIN | Admin Dashboard | Full system administration |
| PUBLIC | Verification Portal | QR code certificate verification (no login) |

## API Documentation

- OpenAPI spec: `docs/api/openapi.yaml`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Demo Workflow

1. Business registers instrument
2. Submits verification application
3. System auto-assigns eligible LMO
4. LMO performs field inspection via mobile app
5. Inspection result: PASS → Certificate generated
6. Certificate includes QR code
7. Public can scan QR to verify authenticity
8. Admin can revoke certificate → QR shows REVOKED

## License

SIH 2026 — Government of India
