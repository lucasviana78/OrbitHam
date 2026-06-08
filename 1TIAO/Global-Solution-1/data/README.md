# Dados

- **`sample_tles.csv`**: conjunto de TLEs reais (ISS + satélites de
  radioamador) usado pela análise de dados. Garante que os notebooks rodem
  offline e de forma reproduzível.

A análise pode opcionalmente buscar um catálogo maior (100+ satélites) do
CelesTrak em tempo de execução. A cópia canônica deste arquivo, usada pelo
código, fica em `../src/apps/analytics/data/sample_tles.csv`.
