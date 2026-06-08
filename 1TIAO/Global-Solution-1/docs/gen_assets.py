"""Gera os assets do relatorio: extrai os graficos dos notebooks e desenha o
diagrama de arquitetura. Saida em docs/img/.
"""
from __future__ import annotations

import base64
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import nbformat

DOCS = Path(__file__).resolve().parent
IMG = DOCS / "img"
IMG.mkdir(exist_ok=True)
NB_DIR = DOCS.parent / "src" / "apps" / "analytics" / "notebooks"


def extract_notebook_figures(nb_path: Path, prefix: str) -> int:
    nb = nbformat.read(nb_path, as_version=4)
    n = 0
    for cell in nb.cells:
        for out in cell.get("outputs", []):
            data = out.get("data", {})
            png = data.get("image/png")
            if not png:
                continue
            (IMG / f"{prefix}_{n}.png").write_bytes(base64.b64decode(png))
            n += 1
    print(f"{prefix}: {n} figuras extraidas")
    return n


def draw_architecture() -> None:
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis("off")

    def box(x, y, w, h, title, sub, color):
        ax.add_patch(
            mpatches.FancyBboxPatch(
                (x, y), w, h,
                boxstyle="round,pad=0.08,rounding_size=0.12",
                linewidth=1.4, edgecolor=color, facecolor=color + "22",
            )
        )
        ax.text(x + w / 2, y + h / 2 + 0.12, title, ha="center", va="center",
                fontsize=10, fontweight="bold", color="#0f172a")
        ax.text(x + w / 2, y + h / 2 - 0.28, sub, ha="center", va="center",
                fontsize=7.5, color="#334155")

    def arrow(x1, y1, x2, y2):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.3))

    # Navegador / Frontend
    box(0.3, 5.0, 2.7, 1.3, "Navegador (Next.js)",
        "Mapa SGP4 ao vivo, dashboard,\napontamento, Doppler", "#38bdf8")
    # Nginx
    box(3.6, 5.2, 1.6, 1.0, "Nginx", "proxy reverso", "#a78bfa")
    # Backend
    box(5.8, 5.0, 3.0, 1.3, "Backend (Django + Ninja)",
        "API, predicao de passagens\n(Skyfield/SGP4)", "#34d399")
    # Postgres
    box(6.0, 3.0, 1.3, 1.0, "PostgreSQL", "satelites, estacoes", "#f59e0b")
    # Redis/Celery
    box(7.6, 3.0, 1.6, 1.0, "Celery + Redis", "import de TLE", "#f87171")
    # Analytics
    box(0.3, 2.8, 3.0, 1.3, "Analise (Python)",
        "Notebooks: decaimento\norbital e melhores janelas", "#22d3ee")
    # ESP32
    box(0.3, 0.6, 3.0, 1.3, "ESP32 (rotor)",
        "controlador Python -> servos\nazimute / elevacao", "#fb923c")

    arrow(3.0, 5.65, 3.6, 5.7)
    arrow(5.2, 5.7, 5.8, 5.7)
    arrow(6.8, 5.0, 6.7, 4.0)
    arrow(8.2, 5.0, 8.4, 4.0)
    arrow(1.8, 2.8, 1.8, 1.9)
    ax.text(1.8, 4.5, "mesmo motor orbital\n(Skyfield / SGP4)", ha="center",
            fontsize=7.5, style="italic", color="#475569")
    arrow(1.8, 4.3, 1.8, 4.1)

    ax.set_title("OrbitHam - Arquitetura da solucao", fontsize=12,
                 fontweight="bold", color="#0f172a", pad=12)
    fig.tight_layout()
    fig.savefig(IMG / "arquitetura.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("arquitetura.png gerado")


if __name__ == "__main__":
    extract_notebook_figures(NB_DIR / "01_decaimento_orbital.ipynb", "decaimento")
    extract_notebook_figures(NB_DIR / "02_passagens_melhores_janelas.ipynb", "passagens")
    draw_architecture()
    print("OK ->", IMG)
