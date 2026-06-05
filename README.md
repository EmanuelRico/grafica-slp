# GRAFICA SLP — Plataforma de Pedidos

Monorepo: React + Vite (frontend) · NestJS (API) · MongoDB Atlas

## Setup rápido

```bash
# Instalar dependencias
pnpm install

# Variables de entorno API
cp apps/api/.env.example apps/api/.env
# Edita .env con tus credenciales

# Levantar todo
pnpm dev
```

## Variables de entorno requeridas (`apps/api/.env`)

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secreto para tokens JWT |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | Nombre del bucket R2 |
| `R2_PUBLIC_URL` | URL pública del bucket |

## Seed inicial

```bash
cd apps/api
cp ../.env.example .env  # editar primero
pnpm seed
# Crea: admin@graficaslp.com / admin123
# Crea: 3 tipos de impresión
```

## URLs de desarrollo

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Admin | http://localhost:5173/admin |

## Despliegue

- **Frontend → Vercel**: conecta el repo, usa `vercel.json` de la raíz
- **API → Render**: crea un Web Service, usa `render.yaml`
- **DB → MongoDB Atlas**: crea cluster M0 (gratis), copia el connection string

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + Framer Motion
- NestJS + Mongoose
- MongoDB Atlas (free tier)
- Cloudflare R2 (file storage)
