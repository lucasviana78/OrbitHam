"""Gera o relatorio da Global Solution em PDF, formatado nas normas ABNT.

Python puro (fpdf2). ABNT aplicado: A4; margens 3-3-2-2 cm (esq/sup/dir/inf);
Times New Roman 12; espacamento 1,5; texto justificado com recuo de paragrafo
de 1,25 cm; secoes numeradas; numero de pagina no canto superior direito; capa
e folha de rosto; figuras com legenda e fonte; referencias.

Rode:  <venv>/bin/python build_pdf.py
"""
from __future__ import annotations

from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

DOCS = Path(__file__).resolve().parent
IMG = DOCS / "img"
ASSETS = DOCS.parent.parent.parent / "assets"  # repo-root/assets
OUT = DOCS / "RELATORIO_GS.pdf"

INK = (0, 0, 0)
MUTED = (90, 90, 90)
CODE_BG = (244, 246, 249)

LH = 6.5          # altura de linha (12pt com espacamento ~1,5)
INDENT = 12.5     # recuo de primeira linha (1,25 cm)
BODY = ("Times", "", 12)

_REPL = {
    "→": "->", "—": "-", "–": "-", "•": "-", "≥": ">=", "≤": "<=",
    "×": "x", "“": '"', "”": '"', "’": "'", "‘": "'", "…": "...",
    "🛰️": "", "📡": "", "🎓": "", "️": "", "🛰": "",
}


def san(text: str) -> str:
    """Latin-1 preserva os acentos do portugues; so trocamos simbolos fora dele."""
    for k, v in _REPL.items():
        text = text.replace(k, v)
    return text.encode("latin-1", "ignore").decode("latin-1")


class Report(FPDF):
    fig_n = 0

    def multi_cell(self, w, h=None, txt="", *a, **k):  # type: ignore[override]
        k.setdefault("new_x", XPos.LMARGIN)
        k.setdefault("new_y", YPos.NEXT)
        return super().multi_cell(w, h, txt, *a, **k)

    def header(self) -> None:
        # ABNT: numeracao no canto superior direito, a partir da parte textual.
        if self.page_no() <= 2:
            return
        self.set_y(15)
        self.set_font("Times", "", 10)
        self.set_text_color(*INK)
        self.cell(0, 5, str(self.page_no()), align="R")
        self.set_y(self.t_margin)


# --------------------------------------------------------------------------- #
# Blocos de conteudo                                                           #
# --------------------------------------------------------------------------- #
def para(pdf: Report, text: str) -> None:
    pdf.set_font(*BODY)
    pdf.set_text_color(*INK)
    usable = pdf.epw
    words = san(text).split()
    first, i = "", 0
    while i < len(words):
        cand = (first + " " + words[i]).strip()
        if pdf.get_string_width(cand) <= usable - INDENT:
            first, i = cand, i + 1
        else:
            break
    if i == 0 and words:
        first, i = words[0], 1
    pdf.set_x(pdf.l_margin + INDENT)
    pdf.cell(usable - INDENT, LH, first)
    pdf.ln(LH)
    if i < len(words):
        pdf.multi_cell(0, LH, " ".join(words[i:]), align="J")
    pdf.ln(2)


def h1(pdf: Report, text: str) -> None:
    if pdf.get_y() > 248:
        pdf.add_page()
    pdf.ln(3)
    pdf.set_font("Times", "B", 12)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, LH, san(text.upper()))
    pdf.ln(2)


def h2(pdf: Report, text: str) -> None:
    pdf.ln(2)
    pdf.set_font("Times", "B", 12)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, LH, san(text))
    pdf.ln(1)


def alineas(pdf: Report, items: list[str]) -> None:
    pdf.set_font(*BODY)
    pdf.set_text_color(*INK)
    letters = "abcdefghijklmnop"
    for k, it in enumerate(items):
        pdf.set_x(pdf.l_margin + INDENT)
        pdf.multi_cell(pdf.epw - INDENT, LH, san(f"{letters[k]}) {it}"), align="J")
    pdf.ln(2)


def code(pdf: Report, text: str, caption: str = "") -> None:
    lines = text.strip("\n").split("\n")
    pdf.set_font("Courier", "", 8.5)
    line_h = 4.2
    height = line_h * len(lines) + 4
    x0, width = pdf.l_margin, pdf.epw
    if pdf.get_y() + height > 268:
        pdf.add_page()
    y0 = pdf.get_y()
    pdf.set_fill_color(*CODE_BG)
    pdf.rect(x0, y0, width, height, style="F")
    pdf.set_xy(x0 + 2, y0 + 2)
    pdf.set_text_color(30, 41, 59)
    for ln in lines:
        pdf.set_x(x0 + 2)
        pdf.cell(0, line_h, san(ln))
        pdf.ln(line_h)
    pdf.ln(1)
    if caption:
        pdf.set_font("Times", "", 10)
        pdf.set_text_color(*MUTED)
        pdf.multi_cell(0, 4.6, san(f"Quadro - {caption}"))
    pdf.ln(2)


def figure(pdf: Report, name: str, desc: str, w: float = 120) -> None:
    path = IMG / name
    if not path.exists():
        return
    pdf.fig_n += 1
    if pdf.get_y() + w * 0.75 + 20 > 275:
        pdf.add_page()
    pdf.set_font("Times", "", 10)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, 5, san(f"Figura {pdf.fig_n} - {desc}"), align="C")
    pdf.image(str(path), x=(210 - w) / 2, w=w)
    pdf.ln(1)
    pdf.set_font("Times", "", 10)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 5, san("Fonte: elaborado pelos autores (2026)."), align="C")
    pdf.ln(3)


AUTHORS = [
    "Arthur Prudêncio Soares - RM569295",
    "Caroline Coelho Mendes - RM570370",
    "Leandro Paiva - RM572159",
    "Lucas Viana de Lima - RM571835",
    "Matheus Tavares Lima - RM572808",
]
TITLE = "ORBITHAM: ESTAÇÃO TERRENA PARA RASTREAMENTO DE SATÉLITES"


def capa(pdf: Report) -> None:
    pdf.add_page()
    pdf.set_auto_page_break(False)

    fiap = ASSETS / "logo-fiap.png"
    if fiap.exists():
        pdf.image(str(fiap), x=(210 - 36) / 2, y=18, w=36)

    pdf.set_y(40)
    pdf.set_font("Times", "B", 12)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, 6, san("FACULDADE DE INFORMÁTICA E ADMINISTRAÇÃO PAULISTA"), align="C")
    pdf.set_font("Times", "", 12)
    pdf.multi_cell(0, 6, san("Graduação ON em Inteligência Artificial"), align="C")

    pdf.set_y(66)
    pdf.set_font("Times", "", 12)
    for a in AUTHORS:
        pdf.multi_cell(0, 6, san(a), align="C")

    logo = ASSETS / "orbitham-logo-dark.png"
    if logo.exists():
        pdf.image(str(logo), x=(210 - 82) / 2, y=110, w=82)

    pdf.set_y(160)
    pdf.set_font("Times", "B", 14)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, 7.5, san(TITLE), align="C")
    pdf.set_font("Times", "", 12)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 6, san("Global Solution 2026.1"), align="C")

    pdf.set_y(192)
    pdf.set_font("Times", "B", 14)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, 8, san("QUERO CONCORRER"), align="C")

    pdf.set_y(262)
    pdf.set_font("Times", "", 12)
    pdf.multi_cell(0, 6, san("São Paulo"), align="C")
    pdf.multi_cell(0, 6, san("2026"), align="C")

    pdf.set_auto_page_break(True, margin=20)


def folha_rosto(pdf: Report) -> None:
    pdf.add_page()
    pdf.set_auto_page_break(False)

    pdf.set_y(36)
    pdf.set_font("Times", "", 12)
    pdf.set_text_color(*INK)
    for a in AUTHORS:
        pdf.multi_cell(0, 6, san(a), align="C")

    pdf.set_y(100)
    pdf.set_font("Times", "B", 14)
    pdf.multi_cell(0, 7.5, san(TITLE), align="C")

    # Natureza do trabalho (bloco recuado a direita, conforme ABNT).
    pdf.set_y(135)
    pdf.set_x(105)
    pdf.set_font("Times", "", 11)
    natureza = (
        "Trabalho apresentado à Faculdade de Informática e Administração "
        "Paulista (FIAP) como requisito da Global Solution 2026.1 do curso de "
        "Graduação ON em Inteligência Artificial."
    )
    pdf.multi_cell(85, 5.5, san(natureza), align="J")

    pdf.set_y(262)
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Times", "", 12)
    pdf.multi_cell(0, 6, san("São Paulo"), align="C")
    pdf.multi_cell(0, 6, san("2026"), align="C")

    pdf.set_auto_page_break(True, margin=20)


def referencias(pdf: Report) -> None:
    pdf.add_page()
    pdf.set_font("Times", "B", 12)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, LH, san("REFERÊNCIAS"), align="C")
    pdf.ln(3)
    refs = [
        "RHODES, Brandon. Skyfield: high precision research-grade positions for "
        "planets and Earth satellites. Disponível em: https://rhodesmill.org/skyfield/. "
        "Acesso em: jun. 2026.",
        "VALLADO, David A. et al. Revisiting Spacetrack Report #3 (SGP4). AIAA, 2006.",
        "CELESTRAK. NORAD GP Element Sets (TLE). Disponível em: "
        "https://celestrak.org/. Acesso em: jun. 2026.",
        "SATELLITE.JS. SGP4/SDP4 implementation in JavaScript. Disponível em: "
        "https://github.com/shashwatak/satellite-js. Acesso em: jun. 2026.",
        "FIAP. Global Solution 2026.1: economia espacial. São Paulo: FIAP, 2026.",
    ]
    pdf.set_font(*BODY)
    for r in refs:
        pdf.multi_cell(0, LH, san(r), align="J")
        pdf.ln(1)


def build() -> None:
    pdf = Report(format="A4")
    pdf.set_margins(30, 30, 20)               # ABNT: esq 3, sup 3, dir 2 (cm)
    pdf.set_auto_page_break(True, margin=20)  # ABNT: inf 2 cm

    capa(pdf)
    folha_rosto(pdf)

    pdf.add_page()
    # 1 INTRODUÇÃO
    h1(pdf, "1 Introdução")
    para(pdf,
         "O espaço deixou de ser apenas exploração científica e se tornou um dos "
         "maiores ecossistemas de inovação e transformação econômica do planeta. "
         "Satélites monitoram o clima, conectam regiões remotas e apoiam decisões "
         "em escala global. Nesse cenário, a comunicação via satélite por "
         "radioamadores depende de operar passagens de satélites de órbita baixa "
         "(LEO): janelas curtas em que o satélite fica acima do horizonte da estação.")
    para(pdf,
         "Operar uma passagem exige responder, em tempo real, a quatro perguntas: "
         "quando o satélite aparece, por quanto tempo, com que qualidade (elevação) "
         "e para onde apontar a antena. Atualmente essas informações ficam "
         "espalhadas em ferramentas diferentes.")
    para(pdf,
         "O OrbitHam, resposta do grupo à Global Solution 2026.1, reúne tudo isso "
         "em uma solução única e prática, com três frentes que compartilham o mesmo "
         "motor de propagação orbital (Skyfield/SGP4): uma aplicação web, uma "
         "camada de análise de dados em Python e a automação de um rotor de antena "
         "com ESP32.")

    # 2 DESENVOLVIMENTO
    h1(pdf, "2 Desenvolvimento")
    h2(pdf, "2.1 Visão geral da solução")
    alineas(pdf, [
        "Aplicação web: mapa orbital ao vivo (SGP4 no navegador), predição de "
        "passagens, dashboard com contagem regressiva e apontamento de antena com "
        "azimute, elevação e correção Doppler;",
        "Análise de dados (Python/Jupyter): previsão de decaimento orbital e "
        "análise de melhores janelas de operação, com Pandas, Matplotlib/Seaborn e "
        "aprendizado de máquina introdutório (scikit-learn);",
        "Automação (ESP32): um controlador em Python calcula o apontamento e envia "
        "por Wi-Fi para um ESP32 que move dois servos, apontando a antena "
        "fisicamente para o satélite.",
    ])

    h2(pdf, "2.2 Arquitetura")
    para(pdf,
         "O backend segue as camadas API, Service, Repository e Model: as rotas "
         "nunca acessam o banco diretamente e as entradas e saídas passam por "
         "esquemas. A propagação orbital roda em Python no backend (Skyfield) e no "
         "navegador (satellite.js), permitindo o tempo real sem custo de servidor. "
         "O mesmo cálculo alimenta a análise de dados e o rotor, mantendo as três "
         "frentes coerentes, como ilustra a figura a seguir.")
    figure(pdf, "arquitetura.png", "Arquitetura da solução OrbitHam.", w=150)

    h2(pdf, "2.3 Códigos principais")
    para(pdf, "A predição de passagens no backend usa o Skyfield (SGP4):")
    code(pdf,
         "times, events = satellite.find_events(\n"
         "    observer, t0, t1, altitude_degrees=10.0)\n"
         "for ti, event in zip(times, events):\n"
         "    if event == 0:   # subida (rise)\n"
         "        current = {'rise': ti.utc_datetime()}\n"
         "    elif event == 1: # pico (culminacao)\n"
         "        alt, _, _ = (satellite - observer).at(ti).altaz()\n"
         "        current['max_elevation'] = alt.degrees\n"
         "    elif event == 2: # descida (set)\n"
         "        passes.append(current)",
         "predição de passagens (backend).")
    para(pdf, "O apontamento (azimute e elevação) e a distância ao satélite:")
    code(pdf,
         "alt, az, distance = (satellite - observer).at(t).altaz()\n"
         "azimute  = az.degrees       # para onde apontar a antena\n"
         "elevacao = alt.degrees      # altura acima do horizonte\n"
         "visivel  = elevacao >= 0    # satelite acima do horizonte",
         "cálculo de apontamento (controlador do rotor).")
    para(pdf, "A regressão do decaimento orbital, na análise de dados:")
    code(pdf,
         "coeffs = np.polyfit(daily['day'], daily['altitude_km'], 2)\n"
         "poly = np.poly1d(coeffs)\n"
         "for day in range(6000):        # ate o limiar de reentrada\n"
         "    if poly(day) <= 120.0:\n"
         "        return day             # estimativa de reentrada",
         "regressão do decaimento orbital.")
    para(pdf, "O firmware do ESP32 recebe os ângulos e move os servos:")
    code(pdf,
         "void handlePoint() {\n"
         "  float az = server.arg(\"az\").toFloat();\n"
         "  float el = server.arg(\"el\").toFloat();\n"
         "  azServo.write(map(az, 0, 360, 0, 180));\n"
         "  elServo.write((int)(el * 2));   // 0..90 -> 0..180\n"
         "}",
         "firmware do rotor (ESP32).")

    h2(pdf, "2.4 Decisões do grupo")
    alineas(pdf, [
        "Propagação SGP4 no navegador para o mapa em tempo real, evitando custo de "
        "servidor e latência;",
        "Skyfield/SGP4 em Python no backend e na análise: preciso, testável e "
        "executável offline;",
        "Análise em notebooks reproduzíveis, para evidenciar o passo a passo de "
        "ciência de dados;",
        "Mesmos limiares de qualidade de passagem (45 e 25 graus) no app e nos "
        "notebooks, mantendo produto e análise consistentes;",
        "Comunicação app/ESP32 por HTTP simples, sem bibliotecas extras no firmware.",
    ])

    # 3 RESULTADOS ESPERADOS
    h1(pdf, "3 Resultados Esperados")
    para(pdf,
         "A solução entrega um produto utilizável e uma análise que orienta a "
         "operação. A seguir, os principais resultados.")
    h2(pdf, "3.1 Previsão de decaimento orbital")
    para(pdf,
         "Propagando o TLE da Estação Espacial Internacional e ajustando uma "
         "regressão, o modelo estima perda de altitude de cerca de 69 km por ano e "
         "reentrada por volta de 2027. A comparação entre satélites mostra que "
         "objetos baixos decaem rápido, enquanto os mais altos são quase estáveis.")
    figure(pdf, "decaimento_2.png", "Regressão do decaimento da ISS e limiar de reentrada.", w=140)
    figure(pdf, "decaimento_3.png", "Taxa de decaimento comparada entre satélites.", w=140)
    h2(pdf, "3.2 Análise de passagens e melhores janelas")
    para(pdf,
         "Para 182 passagens em 14 dias sobre São Paulo, o mapa de calor revela os "
         "melhores horários de operação (em torno das 11h e 22h). Um classificador "
         "prevê a qualidade da passagem com cerca de 84% de acurácia, sendo a "
         "duração a variável mais informativa.")
    figure(pdf, "passagens_2.png", "Passagens por hora e dia da semana (melhores janelas).", w=140)
    figure(pdf, "passagens_1.png", "Distribuição de qualidade das passagens.", w=120)
    figure(pdf, "passagens_4.png", "Relação entre duração e elevação máxima (aprendizado de máquina).", w=140)

    app_dir = IMG / "app"
    shots = sorted(app_dir.glob("*.png")) if app_dir.exists() else []
    if shots:
        h2(pdf, "3.3 Telas do aplicativo")
        for shot in shots:
            figure(pdf, f"app/{shot.name}", "Tela do aplicativo OrbitHam.", w=150)

    # 4 CONCLUSÕES
    h1(pdf, "4 Conclusões")
    para(pdf,
         "O OrbitHam demonstra, na prática, como a tecnologia espacial melhora "
         "processos na Terra: transforma dados orbitais públicos (TLE) em decisões "
         "operacionais claras, de quando e para onde apontar a antena até a "
         "previsão de decaimento de um satélite.")
    para(pdf,
         "A solução integra as competências do curso: programação em Python e "
         "TypeScript, análise de dados e aprendizado de máquina introdutório, "
         "visualização e automação com ESP32, tudo amarrado pelo mesmo motor "
         "orbital. As três frentes se reforçam: o app opera, a análise orienta e o "
         "hardware executa o apontamento.")
    para(pdf,
         "Como evolução, vislumbramos realimentação de posição por sensor inercial "
         "no rotor, integração com rádio definido por software (SDR) para recepção "
         "real, aplicativo móvel e realimentação da análise com o histórico de TLE "
         "já armazenado pelo backend.")

    referencias(pdf)

    pdf.output(str(OUT))
    print("PDF (ABNT) gerado:", OUT)


if __name__ == "__main__":
    build()
