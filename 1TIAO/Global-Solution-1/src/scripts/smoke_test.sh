#!/usr/bin/env bash
#
# OrbitHam — Smoke / Acceptance Test da API do MVP
# =================================================
#
# Valida, de ponta a ponta, os fluxos do contrato de API (docs/API_CONTRACT.md)
# contra a stack rodando via `docker compose up`. Cobre os Critérios de Conclusão
# C1 (Auth), C2 (Satélites/Import), C3 (Estações), C4 (Passagens), C5 (Dashboard)
# do PRD §14.
#
# USO:
#   ./scripts/smoke_test.sh
#   BASE_URL=http://localhost ./scripts/smoke_test.sh        # via Nginx (mesma origem)
#   BASE_URL=http://localhost:8000 ./scripts/smoke_test.sh   # backend direto (default)
#
# VARIÁVEIS DE AMBIENTE:
#   BASE_URL        URL base (default: http://localhost:8000)
#   DEMO_EMAIL      e-mail do usuário demo (default: demo@orbitham.com)
#   DEMO_USERNAME   username p/ register (default: demo)
#   DEMO_PASSWORD   senha demo (default: demo12345)
#
# DEPENDÊNCIAS: curl, jq, bash 4+
#
# SAÍDA: imprime PASS/FAIL colorido por passo. Sai com código != 0 se algum passo falhar.
#
set -uo pipefail

# ----------------------------------------------------------------------------
# Configuração
# ----------------------------------------------------------------------------
BASE_URL="${BASE_URL:-http://localhost:8000}"
API="${BASE_URL%/}/api"
DEMO_EMAIL="${DEMO_EMAIL:-demo@orbitham.com}"
DEMO_USERNAME="${DEMO_USERNAME:-demo}"
DEMO_PASSWORD="${DEMO_PASSWORD:-demo12345}"

COOKIE_JAR="$(mktemp -t orbitham_cookies.XXXXXX)"
BODY_FILE="$(mktemp -t orbitham_body.XXXXXX)"
trap 'rm -f "$COOKIE_JAR" "$BODY_FILE"' EXIT

# Cores (desabilita se não for TTY)
if [ -t 1 ]; then
  C_GREEN='\033[0;32m'; C_RED='\033[0;31m'; C_YELLOW='\033[0;33m'
  C_BLUE='\033[0;34m'; C_RESET='\033[0m'
else
  C_GREEN=''; C_RED=''; C_YELLOW=''; C_BLUE=''; C_RESET=''
fi

PASS_COUNT=0
FAIL_COUNT=0
FAILED_STEPS=()

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf "${C_GREEN}  [PASS]${C_RESET} %s\n" "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  FAILED_STEPS+=("$1")
  printf "${C_RED}  [FAIL]${C_RESET} %s\n" "$1"
  if [ -n "${2:-}" ]; then
    printf "${C_YELLOW}         %s${C_RESET}\n" "$2"
  fi
}

step() {
  printf "\n${C_BLUE}==>${C_RESET} %s\n" "$1"
}

# request METHOD PATH [DATA]
# Faz a requisição, salva o body em $BODY_FILE e ecoa o HTTP status code (stdout).
# Sempre usa o mesmo cookie jar (-c grava, -b envia) para simular browser HttpOnly.
# Django Ninja exige X-CSRFToken nas mutações autenticadas por cookie.
# Lê o token do cookie jar (definido após o login) para métodos != GET.
request() {
  local method="$1" path="$2" data="${3:-}"
  local url="${API}${path}"
  local csrf_h=()
  if [ "$method" != "GET" ]; then
    local t; t="$(awk '$6=="csrftoken"{print $7}' "$COOKIE_JAR" 2>/dev/null | tail -1)"
    [ -n "$t" ] && csrf_h=(-H "X-CSRFToken: $t")
  fi
  if [ -n "$data" ]; then
    curl -sS -o "$BODY_FILE" -w '%{http_code}' \
      -X "$method" "$url" \
      -H 'Content-Type: application/json' \
      "${csrf_h[@]}" \
      -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
      -d "$data"
  else
    curl -sS -o "$BODY_FILE" -w '%{http_code}' \
      -X "$method" "$url" \
      "${csrf_h[@]}" \
      -c "$COOKIE_JAR" -b "$COOKIE_JAR"
  fi
}

# request_headers METHOD PATH [DATA] -> salva headers em arquivo informado via $HDR_FILE
request_with_headers() {
  local method="$1" path="$2" data="${3:-}"
  local url="${API}${path}"
  if [ -n "$data" ]; then
    curl -sS -o "$BODY_FILE" -D "$HDR_FILE" -w '%{http_code}' \
      -X "$method" "$url" \
      -H 'Content-Type: application/json' \
      -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
      -d "$data"
  else
    curl -sS -o "$BODY_FILE" -D "$HDR_FILE" -w '%{http_code}' \
      -X "$method" "$url" \
      -c "$COOKIE_JAR" -b "$COOKIE_JAR"
  fi
}

# envelope_success -> retorna 0 se body é JSON com success==true
envelope_success() {
  jq -e '.success == true' "$BODY_FILE" >/dev/null 2>&1
}

# json_get JQ_EXPR -> imprime valor
json_get() {
  jq -r "$1" "$BODY_FILE" 2>/dev/null
}

# ----------------------------------------------------------------------------
# Checagem de dependências
# ----------------------------------------------------------------------------
check_deps() {
  local missing=()
  for bin in curl jq; do
    if ! command -v "$bin" >/dev/null 2>&1; then
      missing+=("$bin")
    fi
  done
  if [ "${#missing[@]}" -gt 0 ]; then
    printf "${C_RED}Dependências ausentes: %s${C_RESET}\n" "${missing[*]}" >&2
    printf "Instale-as e tente novamente (ex.: sudo apt-get install %s).\n" "${missing[*]}" >&2
    exit 2
  fi
}

# ============================================================================
# INÍCIO
# ============================================================================
check_deps

printf "${C_BLUE}OrbitHam Smoke Test${C_RESET}\n"
printf "Base URL : %s\n" "$BASE_URL"
printf "API      : %s\n" "$API"
printf "Demo     : %s\n" "$DEMO_EMAIL"

# ----------------------------------------------------------------------------
# a) Healthcheck — GET /api/docs (Django Ninja) ou /api
# ----------------------------------------------------------------------------
step "a) Healthcheck da API"
code="$(curl -sS -o /dev/null -w '%{http_code}' "${API}/docs" 2>/dev/null || echo 000)"
if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
  pass "GET /api/docs respondeu ($code)"
else
  # fallback: /api raiz (pode ser 404 do Ninja, mas indica que o servidor está no ar)
  code_root="$(curl -sS -o /dev/null -w '%{http_code}' "${API}" 2>/dev/null || echo 000)"
  if [ "$code_root" != "000" ]; then
    pass "GET /api respondeu ($code_root) — servidor no ar"
  else
    fail "Healthcheck: API não respondeu em ${API}/docs nem ${API}" \
         "A stack está no ar? Tente: docker compose up -d"
    # sem servidor, não adianta continuar
    printf "\n${C_RED}Abortando: API indisponível.${C_RESET}\n"
    exit 1
  fi
fi

# ----------------------------------------------------------------------------
# b) Register (idempotente) + Login → cookies + Set-Cookie access_token
# ----------------------------------------------------------------------------
step "b) Register + Login (C1 - Autenticação)"

# Register: tolerante (usuário demo pode já existir via seed_demo)
reg_payload="$(jq -nc --arg e "$DEMO_EMAIL" --arg u "$DEMO_USERNAME" --arg p "$DEMO_PASSWORD" \
  '{email:$e, username:$u, password:$p}')"
code="$(request POST /auth/register "$reg_payload")"
if [ "$code" = "200" ] || [ "$code" = "201" ]; then
  pass "POST /api/auth/register criou usuário ($code)"
elif [ "$code" = "400" ] || [ "$code" = "409" ] || [ "$code" = "422" ]; then
  pass "POST /api/auth/register — usuário demo já existe (idempotente, $code)"
else
  fail "POST /api/auth/register status inesperado ($code)" "$(head -c 300 "$BODY_FILE")"
fi

# Login com captura de headers para validar Set-Cookie
HDR_FILE="$(mktemp -t orbitham_hdr.XXXXXX)"
login_payload="$(jq -nc --arg e "$DEMO_EMAIL" --arg p "$DEMO_PASSWORD" '{email:$e, password:$p}')"
code="$(request_with_headers POST /auth/login "$login_payload")"
if [ "$code" = "200" ] && envelope_success; then
  pass "POST /api/auth/login 200 + envelope success"
else
  fail "POST /api/auth/login falhou ($code)" "$(head -c 300 "$BODY_FILE")"
fi

if grep -qi 'set-cookie:.*access_token' "$HDR_FILE"; then
  pass "Set-Cookie access_token presente (HttpOnly esperado)"
else
  fail "Set-Cookie access_token ausente no login" \
       "Headers: $(grep -i 'set-cookie' "$HDR_FILE" | head -c 300)"
fi
rm -f "$HDR_FILE"

# ----------------------------------------------------------------------------
# c) GET /api/auth/me → 200 com email demo
# ----------------------------------------------------------------------------
step "c) Perfil autenticado — GET /api/auth/me (C1)"
code="$(request GET /auth/me)"
me_email="$(json_get '.data.email')"
if [ "$code" = "200" ] && envelope_success && [ "$me_email" = "$DEMO_EMAIL" ]; then
  pass "GET /api/auth/me 200, email=$me_email"
else
  fail "GET /api/auth/me falhou ($code, email='$me_email')" "$(head -c 300 "$BODY_FILE")"
fi

# ----------------------------------------------------------------------------
# d) Criar estação + listar (C3 - Estações)
# ----------------------------------------------------------------------------
step "d) Estações — criar e listar (C3)"
stn_payload="$(jq -nc '{name:"Estacao QA Sao Paulo", latitude:-23.55, longitude:-46.63, altitude:760, callsign:"PU2ABC"}')"
code="$(request POST /stations "$stn_payload")"
STATION_ID=""
if { [ "$code" = "200" ] || [ "$code" = "201" ]; } && envelope_success; then
  STATION_ID="$(json_get '.data.id')"
  pass "POST /api/stations criou estação id=$STATION_ID"
else
  fail "POST /api/stations falhou ($code)" "$(head -c 300 "$BODY_FILE")"
fi

code="$(request GET /stations)"
if [ "$code" = "200" ] && envelope_success; then
  if [ -n "$STATION_ID" ] && jq -e --argjson id "$STATION_ID" \
       'any(.data[]?; .id == $id)' "$BODY_FILE" >/dev/null 2>&1; then
    pass "GET /api/stations contém a estação criada (id=$STATION_ID)"
  else
    fail "GET /api/stations não contém a estação criada (id=$STATION_ID)" "$(head -c 300 "$BODY_FILE")"
  fi
else
  fail "GET /api/stations falhou ($code)" "$(head -c 300 "$BODY_FILE")"
fi

# ----------------------------------------------------------------------------
# e) Listar satélites — lista não vazia (C2 - Import automático)
# ----------------------------------------------------------------------------
step "e) Satélites — importação automática (C2)"
code="$(request GET /satellites)"
SATELLITE_ID=""
if [ "$code" = "200" ] && envelope_success; then
  sat_count="$(json_get '.data | length')"
  if [ "${sat_count:-0}" -gt 0 ] 2>/dev/null; then
    pass "GET /api/satellites retornou $sat_count satélite(s) (import automático OK)"
    # Preferir ISS (NORAD 25544 ou nome contendo ISS); senão, o primeiro.
    SATELLITE_ID="$(jq -r '
      ( .data[] | select((.norad_id == 25544) or ((.name // "") | ascii_upcase | test("ISS"))) | .id )
      // empty' "$BODY_FILE" 2>/dev/null | head -n1)"
    if [ -z "$SATELLITE_ID" ]; then
      SATELLITE_ID="$(json_get '.data[0].id')"
      printf "${C_YELLOW}         ISS não encontrada; usando satellite_id=%s${C_RESET}\n" "$SATELLITE_ID"
    else
      printf "         ISS encontrada: satellite_id=%s\n" "$SATELLITE_ID"
    fi
  else
    fail "GET /api/satellites retornou lista vazia (import automático falhou?)" "$(head -c 300 "$BODY_FILE")"
  fi
else
  fail "GET /api/satellites falhou ($code)" "$(head -c 300 "$BODY_FILE")"
fi

# ----------------------------------------------------------------------------
# f) Passagens — 200 + envelope (lista, pode ser vazia) (C4)
# ----------------------------------------------------------------------------
step "f) Passagens — cálculo SGP4/Skyfield (C4)"
if [ -n "$SATELLITE_ID" ] && [ -n "$STATION_ID" ]; then
  code="$(request GET "/passes?satellite_id=${SATELLITE_ID}&station_id=${STATION_ID}&days=3")"
  if [ "$code" = "200" ] && envelope_success; then
    if jq -e '.data | type == "array"' "$BODY_FILE" >/dev/null 2>&1; then
      n="$(json_get '.data | length')"
      pass "GET /api/passes 200, envelope OK, $n passagem(ns)"
      # Se houver passagens, validar estrutura rise/peak/set/max_elevation
      if [ "${n:-0}" -gt 0 ] 2>/dev/null; then
        if jq -e '.data[0] | has("rise") and has("peak") and has("set") and has("max_elevation")' \
             "$BODY_FILE" >/dev/null 2>&1; then
          pass "Passagem contém rise, peak, set e max_elevation"
        else
          fail "Passagem sem campos rise/peak/set/max_elevation" "$(head -c 300 "$BODY_FILE")"
        fi
      fi
    else
      fail "GET /api/passes: data não é lista" "$(head -c 300 "$BODY_FILE")"
    fi
  else
    fail "GET /api/passes falhou ($code)" "$(head -c 300 "$BODY_FILE")"
  fi
else
  fail "Passagens puladas: satellite_id ou station_id ausentes" \
       "satellite_id='$SATELLITE_ID' station_id='$STATION_ID'"
fi

# ----------------------------------------------------------------------------
# g) Dashboard (C5)
# ----------------------------------------------------------------------------
step "g) Dashboard — resumo operacional (C5)"
code="$(request GET /dashboard)"
if [ "$code" = "200" ] && envelope_success; then
  if jq -e '.data | has("active_satellites_count") and has("total_stations")' \
       "$BODY_FILE" >/dev/null 2>&1; then
    asc="$(json_get '.data.active_satellites_count')"
    ts="$(json_get '.data.total_stations')"
    pass "GET /api/dashboard 200 (active_satellites_count=$asc, total_stations=$ts)"
  else
    fail "GET /api/dashboard sem active_satellites_count/total_stations" "$(head -c 300 "$BODY_FILE")"
  fi
else
  fail "GET /api/dashboard falhou ($code)" "$(head -c 300 "$BODY_FILE")"
fi

# ----------------------------------------------------------------------------
# h) Logout + me 401 (C1)
# ----------------------------------------------------------------------------
step "h) Logout + sessão encerrada (C1)"
code="$(request POST /auth/logout)"
if [ "$code" = "200" ] && envelope_success; then
  pass "POST /api/auth/logout 200"
else
  fail "POST /api/auth/logout falhou ($code)" "$(head -c 300 "$BODY_FILE")"
fi

code="$(request GET /auth/me)"
if [ "$code" = "401" ]; then
  pass "GET /api/auth/me após logout retornou 401 (sessão encerrada)"
else
  fail "GET /api/auth/me após logout deveria ser 401, veio $code" "$(head -c 300 "$BODY_FILE")"
fi

# ============================================================================
# Resumo
# ============================================================================
printf "\n${C_BLUE}========================================${C_RESET}\n"
printf "Resultado: ${C_GREEN}%d PASS${C_RESET} / ${C_RED}%d FAIL${C_RESET}\n" "$PASS_COUNT" "$FAIL_COUNT"
if [ "$FAIL_COUNT" -gt 0 ]; then
  printf "${C_RED}Passos com falha:${C_RESET}\n"
  for s in "${FAILED_STEPS[@]}"; do
    printf "  - %s\n" "$s"
  done
  printf "${C_RED}SMOKE TEST FALHOU${C_RESET}\n"
  exit 1
fi
printf "${C_GREEN}SMOKE TEST OK — todos os passos passaram${C_RESET}\n"
exit 0
