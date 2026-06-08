# OrbitHam — Contrato de API do MVP (fonte da verdade para Backend e Frontend)

> Este documento é o **contrato de integração**. Backend e Frontend DEVEM segui-lo à risca.
> Escopo MVP apenas: Auth, Estações, Satélites, Passagens, Dashboard.
> Fora do MVP (não implementar agora): tempo real/WebSocket, ISS, mapa, alertas, doppler, rotor.

## Base
- Todas as rotas sob o prefixo **`/api`** (Django Ninja montado em `/api`).
- Servido atrás do Nginx em `http://localhost` → browser chama caminhos relativos `/api/...` (mesma origem ⇒ cookies HttpOnly funcionam).
- Backend também exposto direto em `http://localhost:8000` para testes.

## Envelope de resposta (OBRIGATÓRIO)
Sucesso:
```json
{ "success": true, "data": <payload> }
```
Erro:
```json
{ "success": false, "message": "Mensagem legível" }
```
Use exceções customizadas no backend (ex.: `StationNotFoundException`) mapeadas para esse envelope.

## Autenticação (JWT em Cookie HttpOnly)
Cookies: `access_token`, `refresh_token` — `HttpOnly`, `SameSite=Lax`, `Secure` controlado por env (`false` em dev).
Proibido `localStorage`/`sessionStorage` no frontend.

| Método | Rota | Body | Resposta `data` |
|---|---|---|---|
| POST | `/api/auth/register` | `{email, username, password}` | `{id, email, username}` |
| POST | `/api/auth/login` | `{email, password}` | `{id, email, username}` + Set-Cookie |
| POST | `/api/auth/refresh` | — (usa cookie) | `{}` + novo Set-Cookie access |
| POST | `/api/auth/logout` | — | `{}` + limpa cookies |
| GET | `/api/auth/me` | — (usa cookie) | `{id, email, username}` |

`register` existe para tornar o app utilizável; `seed_demo` também cria o usuário demo (`demo@orbitham.com` / `demo12345`).

## Estações (`station`) — protegido (dono = usuário logado)
Campos: `id, user_id, name, latitude, longitude, altitude, callsign`

| Método | Rota | Body |
|---|---|---|
| GET | `/api/stations` | — → `data: Station[]` |
| POST | `/api/stations` | `{name, latitude, longitude, altitude, callsign}` |
| GET | `/api/stations/{id}` | — |
| PUT | `/api/stations/{id}` | `{name, latitude, longitude, altitude, callsign}` |
| DELETE | `/api/stations/{id}` | — → `data: {}` |

`latitude` (-90..90), `longitude` (-180..180), `altitude` em metros (float), `callsign` ex. `PU2ABC`.

## Satélites (`satellite`) — protegido (leitura)
Campos: `id, norad_id, name, category, status, tle_1, tle_2, updated_at`

| Método | Rota | Query | Resposta |
|---|---|---|---|
| GET | `/api/satellites` | `?search=&category=` | `data: Satellite[]` |
| GET | `/api/satellites/{id}` | — | `data: Satellite` |
| POST | `/api/satellites/import` | — (admin) | dispara import de TLE (Celery), `data: {imported: n}` |

Importação automática: management command `import_satellites` (Celestrak GROUP=amateur + stations, com fixtures de fallback offline) e Celery beat `update_tle_task` (periódico). Histórico em `satellite_tle_history`.

## Passagens (`pass`) — protegido
| Método | Rota | Query (obrigatórios) |
|---|---|---|
| GET | `/api/passes` | `satellite_id`, `station_id`, `days` (1..10, default 3) |

Resposta `data`: lista ordenada por horário.
```json
[ { "rise": "2026-06-03T18:12:00Z", "peak": "2026-06-03T18:18:00Z",
    "set": "2026-06-03T18:24:00Z", "max_elevation": 74.2 } ]
```
Cálculo com **Skyfield/SGP4** a partir do TLE do satélite e lat/lon/alt da estação. Horizonte mínimo 10° de elevação.

## Dashboard — protegido
| Método | Rota | Resposta `data` |
|---|---|---|
| GET | `/api/dashboard?station_id={id}` | `{ active_satellites_count, total_stations, next_passes: DashboardPass[], active_satellites: Satellite[] }` |

`station_id` (opcional): seleciona a estação que dirige `next_passes`; quando omitido ou inválido, usa a primeira estação do usuário.

`DashboardPass` = `Pass` + `{ satellite_id, satellite_name }`.

`next_passes`: próximas passagens (até ~5) considerando a estação selecionada e satélites ativos; vazio se o usuário não tem estação.

## Tipos compartilhados
Definir os tipos TS em `packages/shared-types` (ou `apps/frontend/src/types`) espelhando exatamente os Schemas do Django Ninja. Frontend valida respostas com Zod.

## Erros padrão
- 401 quando não autenticado → `{success:false, message:"Não autenticado"}`.
- 404 recurso inexistente. 422 validação (Ninja) — normalizar para o envelope `{success:false,message}`.
