# FIAP - Faculdade de Informática e Administração Paulista

<p align="center">
<a href="https://www.fiap.com.br/">
  <img src="../../assets/logo-fiap.png"
       alt="FIAP - Faculdade de Informática e Administração Paulista"
       width="40%">
</a>
</p>

<br>

# OrbitHam · Plataforma de Estação Terrena para Rastreamento de Satélites

## Global Solution 2026.1

## 👨‍🎓 Integrantes:
- Arthur Prudêncio Soares — RM569295
- Caroline Coelho Mendes — RM570370
- Leandro Paiva — RM572159
- Lucas Viana de Lima — RM571835
- Matheus Tavares Lima — RM572808

## 👩‍🏫 Professores:
### Tutor(a)
- *(a definir)*
### Coordenador(a)
- *(a definir)*

## 📜 Descrição

O **OrbitHam** é uma plataforma de **estação terrena** para radioamadores e
entusiastas acompanharem satélites de órbita baixa (LEO) em tempo real. Ele
responde diretamente à pergunta da Global Solution: como a tecnologia espacial
pode tornar processos mais eficientes e criar novas oportunidades na Terra. No
setor de comunicação via satélite, operar uma passagem exige saber **quando** o
satélite aparece, **por quanto tempo**, **com que qualidade** e **para onde
apontar a antena**. O OrbitHam reúne tudo isso em um produto utilizável.

**O aplicativo** (web) oferece:
- **Mapa ao vivo**: propagação orbital SGP4 rodando no próprio navegador
  (satellite.js), com trajetória, área de cobertura e ciclo dia/noite,
  atualizando a cada segundo, sem chamadas ao servidor.
- **Dashboard** com próximas passagens, contagem regressiva para a próxima
  passagem e classificação de qualidade por elevação.
- **Apontamento de antena**: gráfico polar do céu (sky plot), bússola de
  azimute, elevação e cálculo de **Doppler** ao vivo para sintonia da
  frequência.
- **Gestão de estações** terrenas com geolocalização e preenchimento rápido por
  capital brasileira.

**A análise de dados (Python)**, em notebooks Jupyter, agrega a camada de
ciência de dados exigida:
- **Previsão de decaimento orbital**: propaga o TLE no tempo (Skyfield/SGP4),
  calcula a altitude média diária (Pandas), visualiza a tendência
  (Matplotlib/Seaborn) e ajusta uma **regressão** para estimar a taxa de queda
  e um horizonte de reentrada.
- **Análise de passagens e melhores janelas**: gera o conjunto de passagens
  sobre uma estação, explora distribuições e um heatmap de melhores horários, e
  aplica **Machine Learning introdutório** (regressão e um classificador de
  qualidade com scikit-learn).

**A automação com ESP32** (`src/apps/rotor`) fecha o ciclo software para
hardware: um controlador em Python calcula o apontamento (azimute/elevação) com
o mesmo motor orbital e envia por Wi-Fi para um **ESP32 que move dois servos**,
apontando fisicamente uma antena para o satélite. Inclui um modo de demonstração
que varre uma passagem para exibir o movimento.

O projeto conecta as três frentes: app, análise e hardware reaproveitam o mesmo
motor orbital (Skyfield/SGP4) e os mesmos limiares de qualidade (45° e 25°),
mantendo produto, ciência de dados e automação coerentes.

**Stack:** Next.js + TypeScript (frontend), Django + Django Ninja (backend),
PostgreSQL, Celery/Redis, Skyfield/SGP4, Pandas, Matplotlib/Seaborn,
scikit-learn, Docker.

## 📁 Estrutura de pastas

- **src**: todo o código-fonte. Inclui o app web (`src/apps/frontend`,
  `src/apps/backend`), o módulo de análise de dados em Python e notebooks
  (`src/apps/analytics`), a infraestrutura (`src/infra`) e o `docker-compose`.
- **data**: dados utilizados na análise (ex.: `sample_tles.csv`, TLEs reais).
- **docs**: documentação do projeto (arquitetura, PRD, plano de testes,
  diretrizes de código, contrato de API).
- **README.md**: este guia.

## 📎 Links e Observações

- **Vídeo da entrega**: *(adicionar link do vídeo de até 5 min)*
- **Decisões técnicas**: propagação SGP4 no navegador para o tempo real (sem
  custo de servidor) e em Python (Skyfield) no backend e na análise; dados de
  decaimento gerados por propagação SGP4 para serem reproduzíveis e offline;
  limiares de qualidade de passagem compartilhados entre app e notebooks.
- **Observações gerais**: solução autoral desenvolvida pelo grupo.

## 🔧 Como executar o código

Pré-requisitos: **Docker** e **Docker Compose**.

### Aplicação web (Docker)
```bash
cd 1TIAO/Global-Solution-1/src
docker compose up -d --build
```
Acesse **http://localhost**. O backend aplica as migrações e popula dados de
demonstração automaticamente na subida.

### Análise de dados (notebooks Python)
```bash
cd 1TIAO/Global-Solution-1/src/apps/analytics
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/jupyter lab    # abre os notebooks em notebooks/
```
Os notebooks já vêm executados, com gráficos e resultados embutidos. Detalhes em
`src/apps/analytics/README.md`.

### Rotor de antena (ESP32)
Firmware em `src/apps/rotor/firmware` e controlador em Python em
`src/apps/rotor/controller`. Funciona com ou sem hardware (modo demo). Passo a
passo de ligação, gravação e execução em `src/apps/rotor/README.md`.

## 🗃 Histórico de lançamentos

* 0.1.0 - 08/06/2026
    * MVP do app (mapa ao vivo, passagens, apontamento de antena com Doppler).
    * Módulo de análise: previsão de decaimento orbital e melhores janelas.
    * Automação com ESP32: rotor de antena azimute/elevação.

---

## 📋 Licença

<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"><p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://github.com/SabrinaOtoni/TEMPLATE-FIAP-GRAD-ON-IA">MODELO GIT FIAP</a> por <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://fiap.com.br">FIAP</a> está licenciado sobre <a href="http://creativecommons.org/licenses/by/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">Attribution 4.0 International</a>.</p>
