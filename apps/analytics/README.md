# OrbitHam · Análise de dados (Global Solution FIAP)

Módulo de **análise de dados e Machine Learning introdutório em Python**,
complementando o app OrbitHam. Reaproveita o mesmo domínio do produto
(propagação orbital com Skyfield/SGP4 e os mesmos limiares de qualidade de
passagem usados no dashboard), mas roda de forma independente em notebooks
Jupyter, para deixar o passo a passo de data science explícito.

## Notebooks

1. **`notebooks/01_decaimento_orbital.ipynb` — Previsão de decaimento orbital**
   Propaga o TLE de cada satélite no tempo (SGP4), amostra a altitude, suaviza
   em média diária (Pandas), visualiza a tendência (Matplotlib/Seaborn) e
   ajusta uma **regressão** para estimar a taxa de decaimento e um horizonte de
   reentrada. Compara o decaimento entre satélites.

2. **`notebooks/02_passagens_melhores_janelas.ipynb` — Passagens e melhores janelas**
   Gera todas as passagens sobre uma estação ao longo de 14 dias (Skyfield),
   monta um dataset com Pandas, explora distribuições e um **heatmap de melhores
   horários** (Seaborn), e aplica **ML introdutório** (regressão de elevação x
   duração e um classificador de qualidade da passagem com scikit-learn).

Os notebooks já estão **executados com as saídas e gráficos embutidos**, então
dá para abrir e ler sem rodar nada.

## Como rodar

```bash
cd apps/analytics
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt

# Opção A: abrir no Jupyter e executar célula a célula
.venv/bin/jupyter lab            # ou: jupyter notebook

# Opção B: reexecutar tudo de uma vez (regenera as saídas)
.venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/*.ipynb
```

> Para regenerar os `.ipynb` a partir do código-fonte das células:
> `.venv/bin/python build_notebooks.py`

## Estrutura

```
apps/analytics/
  orbitham_analytics/      # pacote Python reutilizável (testável, sem Jupyter)
    tle.py                 # carrega TLEs (CSV offline ou CelesTrak opcional)
    decay.py               # série de altitude, média diária, regressão, reentrada
    passes.py              # dataset de passagens + features (Skyfield)
    quality.py             # classificação de qualidade (45°/25°, igual ao app)
  data/sample_tles.csv     # TLEs reais (ISS + amadores) para rodar offline
  notebooks/               # os dois notebooks (já executados)
  build_notebooks.py       # gerador dos notebooks a partir do código
  requirements.txt
```

## Dados e reprodutibilidade

- Por padrão usa **`data/sample_tles.csv`** (4 TLEs reais), garantindo execução
  offline e resultados estáveis. `orbitham_analytics.load_tles(prefer_online=True)`
  busca o catálogo de radioamadores do CelesTrak quando há rede, escalando a
  análise para 100+ satélites.
- Os notebooks fixam uma data de início (`START`) próxima da época dos TLEs.
  Propagar perto da época é mais preciso e mantém os resultados reproduzíveis.

## Limitações (assumidas)

A previsão de decaimento propaga **um único TLE** para anos à frente. O SGP4
modela o arrasto pelo termo B*, então a *tendência* é significativa, mas datas
absolutas de reentrada são estimativas de ordem de grandeza. Em produção, a
análise seria realimentada com TLEs atualizados (o backend do OrbitHam já
guarda histórico de TLE).
