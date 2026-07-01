# CIEM Backend

Backend API en NestJS con arquitectura modular por features.

## Features

- `auth`
- `users`
- `feed`
- `messages`
- `profile`
- `health`

## Seguridad incluida

- Prefijo global `api/v1`
- Versionado por URI
- `helmet`
- `compression`
- `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`
- CORS restringido por `FRONTEND_URL`
- filtro global de excepciones
- interceptor global para wrapper uniforme de respuestas
- guard base para `x-internal-api-key`

## Variables

Copiar `.env.example` a `.env` y ajustar:

```env
PORT=4000
API_PREFIX=api
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Ejecucion

```bash
npm install
npm run start:dev
```

## Endpoints base

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/feed/posts`
- `POST /api/v1/feed/posts`
- `GET /api/v1/messages/conversations`
- `POST /api/v1/messages/conversations/:id/messages`
- `POST /api/v1/messages/conversations/:id/campaigns`
- `DELETE /api/v1/messages/conversations/:id/campaigns/:campaignId`
- `GET /api/v1/profile/me`
- `PATCH /api/v1/profile/me`
- `DELETE /api/v1/profile/me/projects`
