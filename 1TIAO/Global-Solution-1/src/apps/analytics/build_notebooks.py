"""Generate the two analysis notebooks as valid .ipynb files.

Run with the project venv:  python build_notebooks.py
Then optionally execute to embed outputs:
  jupyter nbconvert --to notebook --execute --inplace notebooks/*.ipynb
"""
from __future__ import annotations

from pathlib import Path

import nbformat as nbf

NB_DIR = Path(__file__).resolve().parent / "notebooks"
NB_DIR.mkdir(exist_ok=True)


def build(cells: list[tuple[str, str]], path: Path) -> None:
    nb = nbf.v4.new_notebook()
    nb.cells = [
        nbf.v4.new_markdown_cell(src)
        if kind == "md"
        else nbf.v4.new_code_cell(src)
        for kind, src in cells
    ]
    nb.metadata = {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {"name": "python"},
    }
    with path.open("w", encoding="utf-8") as handle:
        nbf.write(nb, handle)
    print(f"wrote {path.relative_to(Path.cwd())}")


# --------------------------------------------------------------------------- #
# Notebook 1: orbital decay                                                    #
# --------------------------------------------------------------------------- #
decay_cells: list[tuple[str, str]] = [
    (
        "md",
        "# Previsão de Decaimento Orbital\n\n"
        "**OrbitHam · Global Solution FIAP**\n\n"
        "Satélites em órbita baixa (LEO) perdem altitude continuamente por "
        "causa do arrasto atmosférico. Saber *quanto* e *quão rápido* um "
        "satélite decai ajuda a planejar operações e estimar a reentrada.\n\n"
        "Aqui propagamos o TLE atual de cada satélite no tempo (SGP4, via "
        "Skyfield), amostramos a altitude, suavizamos a oscilação por órbita "
        "em uma **média diária** e ajustamos uma **regressão** para estimar a "
        "taxa de decaimento e um horizonte de reentrada.\n\n"
        "> **Limitação (honesta):** um único TLE propagado para muito longe é "
        "aproximado. O SGP4 modela o arrasto pelo termo B*, então a "
        "*tendência* é significativa, mas datas absolutas de reentrada são "
        "estimativas grosseiras.",
    ),
    (
        "md",
        "> ### Resumo para o vídeo\n"
        "> **O que faz:** prevê o decaimento (perda de altitude) de satélites "
        "propagando o TLE com SGP4 e ajustando uma regressão.\n"
        ">\n"
        "> **Stack:** Python · Skyfield/SGP4 · Pandas · NumPy · Matplotlib/Seaborn.\n"
        ">\n"
        "> **Resultado (ISS):** queda de ~69 km/ano, reentrada estimada por "
        "volta de **2027** (~3 anos).\n"
        ">\n"
        "> **Achado:** satélites baixos (ISS, ~420 km) decaem rápido; altos "
        "(AO-7, ~1450 km) são quase estáveis.",
    ),
    (
        "code",
        "import sys, os\n"
        "sys.path.insert(0, os.path.abspath('..'))\n"
        "%matplotlib inline\n"
        "from datetime import datetime, timezone, timedelta\n"
        "import numpy as np\n"
        "import pandas as pd\n"
        "import matplotlib.pyplot as plt\n"
        "import seaborn as sns\n"
        "import orbitham_analytics as oa\n\n"
        "sns.set_theme(style='whitegrid')\n"
        "plt.rcParams['figure.figsize'] = (9, 4.5)\n\n"
        "# Data de referência fixa (próxima da época dos TLEs) -> reproduzível.\n"
        "START = datetime(2024, 10, 25, tzinfo=timezone.utc)",
    ),
    ("md", "## 1. Carregando os satélites"),
    (
        "code",
        "tles = oa.load_sample()\n"
        "pd.DataFrame([(t.norad_id, t.name, t.category) for t in tles],\n"
        "             columns=['norad_id', 'nome', 'categoria'])",
    ),
    (
        "md",
        "## 2. Série temporal de altitude (ISS)\n\n"
        "Propagamos 2 anos e amostramos a altitude a cada 6 horas.",
    ),
    (
        "code",
        "iss = next(t for t in tles if t.norad_id == 25544)\n"
        "serie = oa.altitude_series(iss.tle_1, iss.tle_2, iss.name,\n"
        "                           days=730, step_hours=6, start=START)\n"
        "serie.head()",
    ),
    (
        "code",
        "plt.plot(serie['time'], serie['altitude_km'], lw=0.6)\n"
        "plt.title(f'Altitude do {iss.name} (amostrada a cada 6h)')\n"
        "plt.xlabel('Tempo'); plt.ylabel('Altitude (km)')\n"
        "plt.show()",
    ),
    (
        "md",
        "## 3. Média diária e tendência de decaimento\n\n"
        "A altitude oscila a cada órbita (órbita elíptica). A média diária "
        "revela a tendência de fundo.",
    ),
    (
        "code",
        "daily = oa.daily_mean_altitude(serie)\n"
        "rate = oa.decay_rate_km_per_year(daily)\n"
        "print(f'Taxa média de decaimento: {rate:.1f} km/ano')\n\n"
        "plt.plot(daily['day'], daily['altitude_km'])\n"
        "plt.title(f'Decaimento do {iss.name}')\n"
        "plt.xlabel('Dias a partir de ' + START.strftime('%d/%m/%Y'))\n"
        "plt.ylabel('Altitude média (km)')\n"
        "plt.show()",
    ),
    (
        "md",
        "## 4. Regressão e estimativa de reentrada\n\n"
        "Ajustamos um polinômio (grau 2) à altitude média e extrapolamos até "
        "o limiar de reentrada (120 km).",
    ),
    (
        "code",
        "poly, coeffs = oa.fit_decay(daily, degree=2)\n"
        "reentry_day = oa.estimate_reentry_day(poly)\n\n"
        "x_fit = np.linspace(0, (reentry_day or daily['day'].max()), 300)\n"
        "plt.scatter(daily['day'], daily['altitude_km'], s=8, alpha=0.5, label='Média diária')\n"
        "plt.plot(x_fit, poly(x_fit), color='crimson', label='Regressão (grau 2)')\n"
        "plt.axhline(oa.REENTRY_ALTITUDE_KM, color='gray', ls='--',\n"
        "            label=f'Reentrada ({oa.REENTRY_ALTITUDE_KM:.0f} km)')\n"
        "plt.title(f'{iss.name}: regressão e extrapolação')\n"
        "plt.xlabel('Dias'); plt.ylabel('Altitude (km)'); plt.legend(); plt.show()\n\n"
        "if reentry_day:\n"
        "    data_reentrada = START + timedelta(days=reentry_day)\n"
        "    print(f'Estimativa ingênua de reentrada: dia {reentry_day} '\n"
        "          f'(~{reentry_day/365.25:.1f} anos), por volta de '\n"
        "          f'{data_reentrada.strftime(\"%m/%Y\")}')\n"
        "else:\n"
        "    print('Sem reentrada no horizonte avaliado.')",
    ),
    (
        "md",
        "## 5. Comparando o decaimento entre satélites\n\n"
        "Nem todos decaem igual: depende da altitude e do arrasto.",
    ),
    (
        "code",
        "linhas = []\n"
        "for t in tles:\n"
        "    s = oa.altitude_series(t.tle_1, t.tle_2, t.name, days=730, step_hours=12, start=START)\n"
        "    d = oa.daily_mean_altitude(s)\n"
        "    linhas.append({'satelite': t.name,\n"
        "                   'altitude_media_km': round(d['altitude_km'].mean(), 1),\n"
        "                   'decaimento_km_ano': round(oa.decay_rate_km_per_year(d), 1)})\n"
        "resumo = pd.DataFrame(linhas).sort_values('decaimento_km_ano')\n"
        "resumo",
    ),
    (
        "code",
        "ax = sns.barplot(data=resumo, x='decaimento_km_ano', y='satelite',\n"
        "                 hue='satelite', palette='rocket', legend=False)\n"
        "ax.set_title('Taxa de decaimento por satélite (negativo = perdendo altitude)')\n"
        "ax.set_xlabel('km/ano'); ax.set_ylabel('')\n"
        "plt.show()",
    ),
    (
        "md",
        "## Conclusões\n\n"
        "- Satélites em órbita mais baixa (como a **ISS**, ~420 km) perdem "
        "altitude bem mais rápido do que satélites altos (como o **AO-7**, "
        "~1450 km), praticamente estáveis.\n"
        "- A regressão dá uma estimativa de ordem de grandeza para a "
        "reentrada, útil para priorizar quais satélites monitorar.\n"
        "- **Limitação:** propagar um único TLE por anos é aproximado; para "
        "uso real, recalcular com TLEs atualizados periodicamente (o OrbitHam "
        "já guarda histórico de TLE, que poderia alimentar esta análise com "
        "dados medidos).",
    ),
]

# --------------------------------------------------------------------------- #
# Notebook 2: passes and best windows                                         #
# --------------------------------------------------------------------------- #
passes_cells: list[tuple[str, str]] = [
    (
        "md",
        "# Análise de Passagens e Melhores Janelas\n\n"
        "**OrbitHam · Global Solution FIAP**\n\n"
        "Para operar uma estação terrena importa saber *quando* os satélites "
        "passam, *por quanto tempo* e *com que qualidade* (elevação máxima). "
        "Aqui geramos todas as passagens sobre uma estação ao longo de 14 "
        "dias e descobrimos os melhores horários para operar.",
    ),
    (
        "md",
        "> ### Resumo para o vídeo\n"
        "> **O que faz:** encontra as melhores janelas para operar a estação, "
        "analisando as passagens dos satélites.\n"
        ">\n"
        "> **Stack:** Python · Skyfield · Pandas · Seaborn · scikit-learn.\n"
        ">\n"
        "> **Dados:** 182 passagens em 14 dias sobre São Paulo (4 satélites).\n"
        ">\n"
        "> **Melhores horários:** por volta das **11h e 22h** (hora local).\n"
        ">\n"
        "> **ML:** classificador de qualidade da passagem com **~84% de "
        "acurácia**; passagens mais longas têm elevação maior.",
    ),
    (
        "code",
        "import sys, os\n"
        "sys.path.insert(0, os.path.abspath('..'))\n"
        "%matplotlib inline\n"
        "from datetime import datetime, timezone\n"
        "import numpy as np\n"
        "import pandas as pd\n"
        "import matplotlib.pyplot as plt\n"
        "import seaborn as sns\n"
        "import orbitham_analytics as oa\n\n"
        "sns.set_theme(style='whitegrid')\n"
        "plt.rcParams['figure.figsize'] = (9, 4.5)\n"
        "START = datetime(2024, 10, 25, tzinfo=timezone.utc)\n\n"
        "# Estação: São Paulo (capital, Sudeste).\n"
        "LAT, LON, ALT = -23.5505, -46.6333, 760",
    ),
    ("md", "## 1. Gerando o conjunto de passagens"),
    (
        "code",
        "tles = oa.load_sample()\n"
        "df = oa.build_pass_dataset(tles, LAT, LON, altitude_m=ALT, days=14, start=START)\n"
        "print(f'{len(df)} passagens em 14 dias, {df.satellite.nunique()} satélites')\n"
        "df[['satellite', 'rise', 'max_elevation', 'duration_min', 'hour', 'quality']].head()",
    ),
    ("md", "## 2. Distribuições\n\nComo se distribuem a elevação máxima e a duração das passagens?"),
    (
        "code",
        "fig, axes = plt.subplots(1, 2, figsize=(11, 4))\n"
        "sns.histplot(df['max_elevation'], bins=18, ax=axes[0], color='#38bdf8')\n"
        "axes[0].axvline(45, color='#34d399', ls='--'); axes[0].axvline(25, color='#facc15', ls='--')\n"
        "axes[0].set_title('Elevação máxima'); axes[0].set_xlabel('graus')\n"
        "sns.histplot(df['duration_min'], bins=18, ax=axes[1], color='#a78bfa')\n"
        "axes[1].set_title('Duração da passagem'); axes[1].set_xlabel('minutos')\n"
        "plt.tight_layout(); plt.show()",
    ),
    (
        "code",
        "ordem = ['Excelente', 'Média', 'Ruim']\n"
        "cores = {'Excelente': '#34d399', 'Média': '#facc15', 'Ruim': '#f87171'}\n"
        "cont = df['quality'].value_counts().reindex(ordem)\n"
        "ax = sns.barplot(x=ordem, y=cont.values, hue=ordem,\n"
        "                 palette=cores, legend=False)\n"
        "ax.set_title('Qualidade das passagens (por elevação máxima)')\n"
        "ax.set_ylabel('nº de passagens')\n"
        "plt.show()",
    ),
    (
        "md",
        "## 3. Melhores janelas (por horário)\n\n"
        "Quando, no dia, há mais passagens e de melhor qualidade? (hora local, UTC-3)",
    ),
    (
        "code",
        "dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']\n"
        "pivot = df.pivot_table(index='hour', columns='weekday',\n"
        "                       values='max_elevation', aggfunc='count', fill_value=0)\n"
        "pivot = pivot.reindex(columns=range(7), fill_value=0)\n"
        "ax = sns.heatmap(pivot, cmap='mako', cbar_kws={'label': 'nº de passagens'})\n"
        "ax.set_xticklabels(dias)\n"
        "ax.set_title('Passagens por hora x dia da semana (hora local)')\n"
        "ax.set_xlabel(''); ax.set_ylabel('hora do dia')\n"
        "plt.show()",
    ),
    (
        "code",
        "por_hora = df.groupby('hour').agg(\n"
        "    passagens=('max_elevation', 'count'),\n"
        "    elev_media=('max_elevation', 'mean'),\n"
        ").reset_index()\n"
        "por_hora['score'] = por_hora['passagens'] * por_hora['elev_media']\n"
        "melhores = por_hora.sort_values('score', ascending=False).head(5)\n"
        "print('Melhores janelas (hora local):')\n"
        "for _, r in melhores.iterrows():\n"
        "    print(f'  {int(r.hour):02d}h  ->  {int(r.passagens)} passagens, '\n"
        "          f'elevação média {r.elev_media:.0f}°')\n\n"
        "ax = sns.barplot(data=por_hora, x='hour', y='score', color='#38bdf8')\n"
        "ax.set_title('Pontuação de cada horário (passagens x elevação média)')\n"
        "ax.set_xlabel('hora local'); ax.set_ylabel('score')\n"
        "plt.show()",
    ),
    ("md", "## 4. Melhores satélites"),
    (
        "code",
        "por_sat = df.groupby('satellite').agg(\n"
        "    passagens=('max_elevation', 'count'),\n"
        "    elev_media=('max_elevation', 'mean'),\n"
        "    elev_max=('max_elevation', 'max'),\n"
        "    dur_media=('duration_min', 'mean'),\n"
        ").round(1).sort_values('elev_media', ascending=False)\n"
        "por_sat",
    ),
    (
        "md",
        "## 5. Machine Learning introdutório\n\n"
        "Duas perguntas:\n"
        "1. **Regressão:** passagens mais longas tendem a ter elevação mais alta?\n"
        "2. **Classificação:** dá para prever a *qualidade* de uma passagem a "
        "partir de características dela?",
    ),
    (
        "code",
        "from sklearn.linear_model import LinearRegression\n"
        "from sklearn.metrics import r2_score\n\n"
        "X = df[['duration_min']].to_numpy()\n"
        "y = df['max_elevation'].to_numpy()\n"
        "reg = LinearRegression().fit(X, y)\n"
        "pred = reg.predict(X)\n"
        "print(f'max_elevation ~ {reg.coef_[0]:.2f} * duracao + {reg.intercept_:.1f}')\n"
        "print(f'R2 = {r2_score(y, pred):.2f}')\n\n"
        "ax = sns.scatterplot(data=df, x='duration_min', y='max_elevation', hue='quality',\n"
        "                     palette={'Excelente': '#34d399', 'Média': '#facc15', 'Ruim': '#f87171'})\n"
        "xs = np.linspace(df.duration_min.min(), df.duration_min.max(), 100)\n"
        "ax.plot(xs, reg.predict(xs.reshape(-1, 1)), color='black', lw=1.5, label='regressão')\n"
        "ax.set_title('Elevação máxima x duração da passagem')\n"
        "ax.set_xlabel('duração (min)'); ax.set_ylabel('elevação máx (graus)')\n"
        "plt.legend(); plt.show()",
    ),
    (
        "code",
        "from sklearn.tree import DecisionTreeClassifier\n"
        "from sklearn.model_selection import train_test_split\n"
        "from sklearn.metrics import accuracy_score, classification_report\n\n"
        "feat = df.copy()\n"
        "feat['sat_code'] = feat['satellite'].astype('category').cat.codes\n"
        "X = feat[['duration_min', 'hour', 'sat_code']]\n"
        "y = feat['quality']\n"
        "Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)\n"
        "clf = DecisionTreeClassifier(max_depth=4, random_state=42).fit(Xtr, ytr)\n"
        "pred = clf.predict(Xte)\n"
        "print(f'Acurácia: {accuracy_score(yte, pred):.2f}')\n"
        "print(classification_report(yte, pred))\n\n"
        "imp = pd.Series(clf.feature_importances_, index=X.columns).sort_values()\n"
        "ax = imp.plot(kind='barh', color='#38bdf8')\n"
        "ax.set_title('Importância das variáveis (classificação de qualidade)')\n"
        "plt.show()",
    ),
    (
        "md",
        "## Conclusões\n\n"
        "- As **melhores janelas** sobre a estação se concentram em certos "
        "horários (ver heatmap e pontuação), o que permite planejar a operação.\n"
        "- Há uma relação clara e fisicamente esperada: **passagens mais "
        "longas tendem a ter elevação máxima maior**, pois passagens próximas "
        "do zênite cruzam mais céu.\n"
        "- O classificador prevê a **qualidade** da passagem com boa acurácia "
        "usando duração, horário e satélite; a **duração** é a variável mais "
        "informativa.\n"
        "- Tudo reaproveita o mesmo motor (Skyfield) e os mesmos limiares de "
        "qualidade (45°/25°) do app OrbitHam, mantendo análise e produto "
        "coerentes.",
    ),
]


if __name__ == "__main__":
    build(decay_cells, NB_DIR / "01_decaimento_orbital.ipynb")
    build(passes_cells, NB_DIR / "02_passagens_melhores_janelas.ipynb")
    print("done")
