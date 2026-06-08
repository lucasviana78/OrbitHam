# FIAP - Faculdade de Informática e Administração Paulista

<p align="center">
<a href="https://www.fiap.com.br/">
  <img src="../../assets/logo-fiap.png"
       alt="FIAP - Faculdade de Informática e Administração Paulista"
       width="40%">
</a>
</p>

<br>

# OrbitHam · Estação Terrena para Rastreamento de Satélites

## Global Solution 2026.1

## 👨‍🎓 Integrantes
- Arthur Prudêncio Soares — RM569295
- Caroline Coelho Mendes — RM570370
- Leandro Paiva — RM572159
- Lucas Viana de Lima — RM571835
- Matheus Tavares Lima — RM572808

## 📜 Sobre

O **OrbitHam** é uma plataforma de estação terrena para rastreamento de
satélites de órbita baixa, com três frentes integradas: a **aplicação web**
(mapa ao vivo, passagens, apontamento de antena com Doppler), a **análise de
dados** em Python (decaimento orbital e melhores janelas) e a **automação** de
um rotor de antena com **ESP32**.

➡️ **A documentação completa (descrição, arquitetura, execução, integrantes)
está no [README principal do repositório](../../README.md).** Este arquivo segue
a estrutura do template FIAP.

## 📁 Estrutura

- **src**: código-fonte (`apps/frontend`, `apps/backend`, `apps/analytics`,
  `apps/rotor`), infraestrutura e `docker-compose`.
- **data**: dados utilizados na análise (TLEs).
- **docs**: documentação do projeto e o relatório da Global Solution
  (`RELATORIO_GS.pdf`).

## 🔧 Como executar

```bash
cd src
docker compose up -d --build      # app em http://localhost
```
Notebooks de análise em `src/apps/analytics` e rotor ESP32 em `src/apps/rotor`
(veja os READMEs de cada um).

---

## 📋 Licença

<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1"><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1"><p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://github.com/SabrinaOtoni/TEMPLATE-FIAP-GRAD-ON-IA">MODELO GIT FIAP</a> por <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://fiap.com.br">FIAP</a> está licenciado sobre <a href="http://creativecommons.org/licenses/by/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">Attribution 4.0 International</a>.</p>
