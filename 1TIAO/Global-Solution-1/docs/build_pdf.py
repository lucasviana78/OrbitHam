"""Gera o relatorio da Global Solution em PDF (RELATORIO_GS.pdf).

Python puro (fpdf2), sem dependencias de sistema. Usa as imagens de docs/img.
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

INK = (15, 23, 42)
ACCENT = (2, 132, 199)
MUTED = (71, 85, 105)
CODE_BG = (241, 245, 249)

_REPL = {
    "→": "->", "—": "-", "–": "-", "•": "-", "≥": ">=", "≤": "<=",
    "×": "x", "“": '"', "”": '"', "’": "'", "‘": "'", "…": "...",
    "🛰️": "", "📡": "", "🎓": "", "✨": "", "🧰": "", "🏛️": "",
    "📁": "", "🔧": "", "📜": "", "👨‍🎓": "", "️": "", "🛰": "",
}


def san(text: str) -> str:
    for key, value in _REPL.items():
        text = text.replace(key, value)
    return text.encode("latin-1", "ignore").decode("latin-1")


class Report(FPDF):
    def multi_cell(self, w, h=None, txt="", *args, **kwargs):  # type: ignore[override]
        # Sempre volta o cursor para a margem esquerda, evitando largura zero.
        kwargs.setdefault("new_x", XPos.LMARGIN)
        kwargs.setdefault("new_y", YPos.NEXT)
        return super().multi_cell(w, h, txt, *args, **kwargs)

    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_y(8)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 5, san("OrbitHam - Global Solution 2026.1 - FIAP"), align="R")
        self.ln(6)

    def footer(self) -> None:
        if self.page_no() == 1:
            return
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 5, str(self.page_no()), align="C")


def cover(pdf: Report) -> None:
    pdf.add_page()
    logo = ASSETS / "logo-fiap.png"
    if logo.exists():
        pdf.image(str(logo), x=(210 - 60) / 2, y=22, w=60)
    pdf.set_y(64)
    pdf.set_text_color(*INK)
    pdf.set_font("Helvetica", "B", 22)
    pdf.multi_cell(0, 11, san("OrbitHam"), align="C")
    pdf.set_font("Helvetica", "", 14)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 8, san("Estacao Terrena para Rastreamento de Satelites"), align="C")
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*ACCENT)
    pdf.multi_cell(0, 7, san("Global Solution 2026.1 - Graduacao ON em IA"), align="C")

    pdf.ln(12)
    pdf.set_text_color(*INK)
    pdf.set_font("Helvetica", "B", 12)
    pdf.multi_cell(0, 7, san("Integrantes"), align="C")
    pdf.set_font("Helvetica", "", 12)
    for nome in [
        "Arthur Prudencio Soares - RM569295",
        "Caroline Coelho Mendes - RM570370",
        "Leandro Paiva - RM572159",
        "Lucas Viana de Lima - RM571835",
        "Matheus Tavares Lima - RM572808",
    ]:
        pdf.multi_cell(0, 7, san(nome), align="C")

    pdf.ln(10)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*ACCENT)
    pdf.multi_cell(0, 9, san("QUERO CONCORRER"), align="C")


def h1(pdf: Report, text: str) -> None:
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 15)
    pdf.set_text_color(*ACCENT)
    pdf.multi_cell(0, 8, san(text))
    pdf.set_draw_color(*ACCENT)
    pdf.set_line_width(0.4)
    y = pdf.get_y()
    pdf.line(pdf.l_margin, y, 210 - pdf.r_margin, y)
    pdf.ln(3)


def h2(pdf: Report, text: str) -> None:
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, 7, san(text))
    pdf.ln(1)


def para(pdf: Report, text: str) -> None:
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*INK)
    pdf.multi_cell(0, 5.6, san(text))
    pdf.ln(2)


def bullets(pdf: Report, items: list[str]) -> None:
    pdf.set_font("Helvetica", "", 10.5)
    pdf.set_text_color(*INK)
    for it in items:
        x = pdf.get_x()
        pdf.cell(5, 5.6, "-")
        pdf.set_x(x + 5)
        pdf.multi_cell(0, 5.6, san(it))
    pdf.ln(2)


def code(pdf: Report, text: str, caption: str = "") -> None:
    lines = text.strip("\n").split("\n")
    pdf.set_font("Courier", "", 8.5)
    line_h = 4.2
    height = line_h * len(lines) + 4
    pdf.set_fill_color(*CODE_BG)
    x0, y0 = pdf.l_margin, pdf.get_y()
    width = 210 - pdf.l_margin - pdf.r_margin
    if y0 + height > 285:
        pdf.add_page()
        y0 = pdf.get_y()
    pdf.rect(x0, y0, width, height, style="F")
    pdf.set_xy(x0 + 2, y0 + 2)
    pdf.set_text_color(30, 41, 59)
    for ln in lines:
        pdf.set_x(x0 + 2)
        pdf.cell(0, line_h, san(ln))
        pdf.ln(line_h)
    pdf.ln(1)
    if caption:
        pdf.set_font("Helvetica", "I", 8.5)
        pdf.set_text_color(*MUTED)
        pdf.multi_cell(0, 4.5, san(caption))
    pdf.ln(2)


def figure(pdf: Report, name: str, caption: str, w: float = 150) -> None:
    path = IMG / name
    if not path.exists():
        return
    if pdf.get_y() + w * 0.6 > 280:
        pdf.add_page()
    pdf.image(str(path), x=(210 - w) / 2, w=w)
    pdf.ln(1)
    pdf.set_font("Helvetica", "I", 8.5)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 4.5, san(caption), align="C")
    pdf.ln(3)


def build() -> None:
    pdf = Report(format="A4")
    pdf.set_auto_page_break(True, margin=15)
    pdf.set_margins(18, 14, 18)

    cover(pdf)
    pdf.add_page()

    # ---- 1. Introducao ----
    h1(pdf, "1. Introducao")
    para(pdf,
         "O espaco deixou de ser apenas exploracao cientifica e se tornou um dos "
         "maiores ecossistemas de inovacao e transformacao economica do planeta. "
         "Satelites monitoram o clima, conectam regioes remotas e apoiam decisoes "
         "em escala global. Dentro desse cenario, a comunicacao via satelite por "
         "radioamadores depende de operar passagens de satelites de orbita baixa "
         "(LEO): janelas curtas em que o satelite fica acima do horizonte da "
         "estacao.")
    para(pdf,
         "Operar uma passagem exige responder, em tempo real, a quatro perguntas: "
         "quando o satelite aparece, por quanto tempo, com que qualidade "
         "(elevacao) e para onde apontar a antena. Hoje essas informacoes ficam "
         "espalhadas em ferramentas diferentes.")
    para(pdf,
         "O OrbitHam, nossa resposta a Global Solution 2026.1, reune tudo isso em "
         "uma solucao unica e pratica, com tres frentes que compartilham o mesmo "
         "motor de propagacao orbital (Skyfield/SGP4): uma aplicacao web, uma "
         "camada de analise de dados em Python e a automacao de um rotor de "
         "antena com ESP32.")

    # ---- 2. Desenvolvimento ----
    h1(pdf, "2. Desenvolvimento")

    h2(pdf, "2.1 Visao geral da solucao")
    bullets(pdf, [
        "Aplicacao web: mapa orbital ao vivo (SGP4 no navegador), predicao de "
        "passagens, dashboard com contagem regressiva e apontamento de antena "
        "com azimute, elevacao e correcao Doppler.",
        "Analise de dados (Python/Jupyter): previsao de decaimento orbital e "
        "analise de melhores janelas de operacao, com Pandas, Matplotlib/Seaborn "
        "e Machine Learning introdutorio (scikit-learn).",
        "Automacao (ESP32): um controlador em Python calcula o apontamento e "
        "envia por Wi-Fi para um ESP32 que move dois servos, apontando a antena "
        "fisicamente para o satelite.",
    ])

    h2(pdf, "2.2 Arquitetura")
    para(pdf,
         "O backend segue camadas API -> Service -> Repository -> Model: as rotas "
         "nunca acessam o banco diretamente e as entradas/saidas passam por "
         "Schemas. A propagacao orbital roda em Python no backend (Skyfield) e no "
         "navegador (satellite.js) para o tempo real sem custo de servidor. O "
         "mesmo calculo alimenta a analise de dados e o rotor, mantendo as tres "
         "frentes coerentes.")
    figure(pdf, "arquitetura.png", "Figura 1. Arquitetura da solucao OrbitHam.", w=165)

    h2(pdf, "2.3 Codigos principais")
    para(pdf, "Predicao de passagens no backend (Skyfield/SGP4):")
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
         "apps/backend/passes/services/pass_prediction_service.py")
    para(pdf, "Apontamento (azimute/elevacao) e distancia ao satelite:")
    code(pdf,
         "alt, az, distance = (satellite - observer).at(t).altaz()\n"
         "azimute   = az.degrees      # bussola: para onde apontar\n"
         "elevacao  = alt.degrees     # altura acima do horizonte\n"
         "visivel   = elevacao >= 0   # satelite acima do horizonte",
         "apps/rotor/controller/rotor_controller.py")
    para(pdf, "Regressao do decaimento orbital (analise de dados):")
    code(pdf,
         "coeffs = np.polyfit(daily['day'], daily['altitude_km'], 2)\n"
         "poly = np.poly1d(coeffs)\n"
         "# extrapola ate o limiar de reentrada (120 km)\n"
         "for day in range(6000):\n"
         "    if poly(day) <= 120.0:\n"
         "        return day  # estimativa de reentrada",
         "apps/analytics/orbitham_analytics/decay.py")
    para(pdf, "Firmware do ESP32 recebendo o apontamento e movendo os servos:")
    code(pdf,
         "void handlePoint() {\n"
         "  float az = server.arg(\"az\").toFloat();\n"
         "  float el = server.arg(\"el\").toFloat();\n"
         "  azServo.write(map(az, 0, 360, 0, 180));\n"
         "  elServo.write((int)(el * 2));   // 0..90 -> 0..180\n"
         "  digitalWrite(LED_PIN, visible ? HIGH : LOW);\n"
         "}",
         "apps/rotor/firmware/rotor_esp32/rotor_esp32.ino")

    h2(pdf, "2.4 Decisoes do grupo")
    bullets(pdf, [
        "Propagacao SGP4 no navegador (satellite.js) para o mapa em tempo real, "
        "evitando custo de servidor e latencia.",
        "Skyfield/SGP4 em Python no backend e na analise: preciso, testavel e "
        "executavel offline.",
        "Analise em notebooks Jupyter, reproduzivel (dados de TLE embutidos), "
        "para evidenciar o passo a passo de ciencia de dados.",
        "Mesmos limiares de qualidade de passagem (45 graus e 25 graus) no app e "
        "nos notebooks, mantendo produto e analise consistentes.",
        "Comunicacao app/ESP32 por HTTP simples (form-urlencoded), sem "
        "bibliotecas extras no firmware.",
        "Interface inteiramente em portugues.",
    ])

    # ---- 3. Resultados Esperados ----
    pdf.add_page()
    h1(pdf, "3. Resultados Esperados")
    para(pdf,
         "A solucao entrega um produto utilizavel e uma analise que orienta a "
         "operacao. A seguir, os principais resultados.")

    h2(pdf, "3.1 Previsao de decaimento orbital")
    para(pdf,
         "Propagando o TLE da ISS e ajustando uma regressao, o modelo estima uma "
         "perda de altitude de cerca de 69 km/ano e uma reentrada por volta de "
         "2027. A comparacao entre satelites mostra que objetos baixos (ISS, ~420 "
         "km) decaem rapido, enquanto altos (AO-7, ~1450 km) sao quase estaveis.")
    figure(pdf, "decaimento_2.png", "Figura 2. Regressao do decaimento da ISS e limiar de reentrada.", w=150)
    figure(pdf, "decaimento_3.png", "Figura 3. Taxa de decaimento comparada entre satelites.", w=150)

    h2(pdf, "3.2 Analise de passagens e melhores janelas")
    para(pdf,
         "Para 182 passagens em 14 dias sobre Sao Paulo, o heatmap revela os "
         "melhores horarios de operacao (em torno das 11h e 22h, hora local). Um "
         "classificador (arvore de decisao) preve a qualidade da passagem com "
         "cerca de 84% de acuracia, e a duracao da passagem e a variavel mais "
         "informativa.")
    figure(pdf, "passagens_2.png", "Figura 4. Passagens por hora e dia da semana (melhores janelas).", w=150)
    figure(pdf, "passagens_1.png", "Figura 5. Distribuicao de qualidade das passagens.", w=130)
    figure(pdf, "passagens_4.png", "Figura 6. Relacao entre duracao e elevacao maxima (ML).", w=150)

    # screenshots opcionais do app (docs/img/app/*.png)
    app_dir = IMG / "app"
    shots = sorted(app_dir.glob("*.png")) if app_dir.exists() else []
    if shots:
        h2(pdf, "3.3 Telas do aplicativo")
        for i, shot in enumerate(shots, start=7):
            figure(pdf, f"app/{shot.name}", f"Figura {i}. Tela do OrbitHam.", w=160)

    # ---- 4. Conclusoes ----
    h1(pdf, "4. Conclusoes")
    para(pdf,
         "O OrbitHam demonstra, na pratica, como a tecnologia espacial melhora "
         "processos na Terra: transforma dados orbitais publicos (TLE) em "
         "decisoes operacionais claras, de quando e para onde apontar a antena "
         "ate a previsao de decaimento de um satelite.")
    para(pdf,
         "A solucao integra as competencias do curso: programacao (Python e "
         "TypeScript), analise de dados e Machine Learning introdutorio, "
         "visualizacao, e automacao com ESP32, tudo amarrado pelo mesmo motor "
         "orbital. As tres frentes se reforcam: o app opera, a analise orienta e "
         "o hardware executa o apontamento.")
    para(pdf,
         "Como evolucao, vislumbramos realimentacao de posicao por sensor IMU no "
         "rotor, integracao com SDR para recepcao real, aplicativo mobile e "
         "realimentacao da analise com o historico de TLE ja armazenado pelo "
         "backend.")

    pdf.output(str(OUT))
    print("PDF gerado:", OUT)


if __name__ == "__main__":
    build()
