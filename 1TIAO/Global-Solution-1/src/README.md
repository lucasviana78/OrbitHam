# OrbitHam

Plataforma web para radioamadores e entusiastas de satélites: importação automática de
TLEs, cadastro de estações terrestres e cálculo de passagens orbitais, tudo em um
dashboard com tema Dark / Space.

> Projeto acadêmico/demonstração de mecânica orbital aplicada. Este repositório entrega o
> **MVP**. Funcionalidades como tempo real, ISS, mapa, alertas, Doppler e rotor fazem parte
> do roadmap futuro (ver [Escopo](#escopo-mvp-vs-roadmap)).

## Visão geral

- **Auth** — login/registro com JWT em **Cookie HttpOnly**, refresh e perfil.
- **Satélites** — importação automática de TLE (Celestrak, com fallback offline) e atualização periódica via Celery.
- **Estações** — CRUD de estações de rádio (lat/lon/alt/callsign).
- **Passagens** — cálculo de rise/peak/set e elevação máxima via Skyfield/SGP4.
- **Dashboard** — resumo operacional: satélites ativos, estações e próximas passagens.

## Stack

**Backend:** Python 3.13 · Django 5 · Django Ninja · PostgreSQL 17 · Redis · Celery · Skyfield · SGP4
**Frontend:** Next.js (App Router) · React · TypeScript · Tailwind CSS · Shadcn/UI · TanStack Query · Zustand · Zod
**Infra:** Docker Compose · Nginx · PostgreSQL · Redis

## Estrutura do monorepo

```text
orbit_ham/
├── apps/
│   ├── backend/        # Django + Django Ninja (API em /api)
│   └── frontend/       # Next.js (App Router)
├── packages/
│   ├── shared-types/   # Tipos TS espelhando os Schemas do backend
│   └── ui/             # Componentes de UI compartilhados
├── infra/
│   ├── nginx/          # Reverse proxy (app + /api)
│   ├── postgres/
│   └── redis/
├── docs/               # PRD, Arquitetura, Guidelines, Contrato de API, Sprint, Tracker
├── docker-compose.yml
└── README.md
```

Arquitetura backend (obrigatória): `API → Service → Repository → Model`. Rotas nunca
acessam o ORM diretamente. Entradas e saídas sempre via Schema do Django Ninja.

## Execução em localhost (Docker Compose)

Pré-requisitos: Docker e Docker Compose.

```bash
# 1. Variáveis de ambiente (já feito neste repositório)
cp .env.example .env

# 2. Build e subida de toda a stack
docker compose up --build
```

A subida do backend roda automaticamente `migrate`, `seed_demo` (cria o usuário demo) e
inicia o Gunicorn; o `celery-beat` agenda a atualização periódica de TLE.

### URLs

| URL | Descrição |
|---|---|
| http://localhost | Aplicação (frontend via Nginx) |
| http://localhost/api | API (mesma origem — cookies HttpOnly funcionam) |
| http://localhost:8000/api | API direta no backend (para testes) |
| http://localhost/admin | Django Admin |

### Credenciais demo

```text
e-mail: demo@orbitham.com
senha:  demo12345
```

Criadas pelo comando `seed_demo` (executado na subida do backend). Também é possível
registrar novos usuários em `POST /api/auth/register`.

## Testes

Cobertura mínima exigida: **80%** (backend e frontend).

```bash
# Backend (pytest / pytest-django / factory-boy)
docker compose exec backend pytest

# Frontend (vitest)
docker compose exec frontend pnpm vitest
```

> Os testes podem ser executados também localmente dentro de cada app
> (`apps/backend`, `apps/frontend`) com o ambiente correspondente instalado.

## Escopo MVP vs roadmap

### MVP (entregue neste repositório)

- Login / Autenticação (JWT em Cookie HttpOnly)
- Importação automática de TLE (satélites)
- Cadastro de estações
- Consulta de passagens (rise/peak/set + elevação máxima)
- Dashboard operacional

O contrato de integração da API está em
[`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md).

### Roadmap futuro (fora do MVP)

| Versão | Itens |
|---|---|
| **V1** | Rastreamento em tempo real · Rastreador da ISS · Mapa em tempo real · Alertas por e-mail |
| **V2** | Correção Doppler · Controle de rotor (GS-232 / EasyComm) · Predição de qualidade de link |
| **V3** | Aplicativo mobile (Android/iOS) · Integração SDR · Controle remoto de estação |

## Documentação

Documentação completa no [README principal do repositório](../../../README.md).
Contrato de API em [`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md).
