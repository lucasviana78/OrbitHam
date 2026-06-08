# OrbitHam · Rotor de antena (ESP32)

Parte de **automação/hardware** da Global Solution. Fecha o ciclo
**software → hardware**: o app (ou o controlador em Python) calcula o
apontamento azimute/elevação de um satélite e o **ESP32 move dois servos** para
apontar uma antena/ponteiro para ele em tempo real.

```
  Satélite (TLE)                 Wi-Fi (HTTP)              Servos
  ────────────► [ controlador Python / app ] ──► [ ESP32 ] ──► AZ + EL
        Skyfield/SGP4 calcula AZ/EL            move o ponteiro p/ o satélite
```

## Componentes

- 1x **ESP32** (DevKit)
- 2x **servos** (SG90 para protótipo leve, ou MG996R com mais torque)
- 1x **fonte 5V** externa para os servos (não alimente os servos pelo 5V do ESP32)
- Uma base **pan/tilt** (azimute embaixo, elevação em cima) e um ponteiro/laser/antena

## Ligação (pinos padrão do firmware)

| Sinal           | ESP32      | Observação                              |
|-----------------|------------|-----------------------------------------|
| Servo AZIMUTE   | GPIO 13    | fio de sinal do servo                   |
| Servo ELEVAÇÃO  | GPIO 12    | fio de sinal do servo                   |
| LED de status   | GPIO 2     | onboard, acende quando o sat. é visível |
| Servos VCC      | 5V (fonte) | fonte externa                           |
| GND comum       | GND        | **GND da fonte e do ESP32 juntos**      |

## 1. Firmware (ESP32)

1. Na **Arduino IDE**, instale o suporte a placas **ESP32** (Espressif) e a
   biblioteca **ESP32Servo** (Library Manager).
2. Abra `firmware/rotor_esp32/rotor_esp32.ino`.
3. Edite `WIFI_SSID` e `WIFI_PASS` com a sua rede.
4. Selecione a placa **ESP32 Dev Module** e a porta, e faça o upload.
5. Abra o **Monitor Serial** (115200). O ESP32 imprime o **IP** dele ao
   conectar (ex.: `IP do rotor: 192.168.0.50`). Anote esse IP.

Teste rápido sem o controlador:
```bash
curl -X POST "http://192.168.0.50/point" -d "az=120&el=40&visible=1"
```
Os servos devem se mover. `http://<ip>/` mostra uma página de status.

## 2. Controlador (Python)

```bash
cd 1TIAO/Global-Solution-1/src/apps/rotor
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

Rastrear um satélite e enviar ao rotor:
```bash
.venv/bin/python controller/rotor_controller.py --esp32 192.168.0.50 \
    --name "ISS (ZARYA)" --lat -23.5505 --lon -46.6333 --alt 760
```

Sem hardware (apenas imprime os ângulos):
```bash
.venv/bin/python controller/rotor_controller.py --name "ISS (ZARYA)"
```

**Modo demo (recomendado para o vídeo):** varre uma passagem sintética, fazendo
os servos subirem, cruzarem o céu e descerem, sem esperar uma passagem real:
```bash
.venv/bin/python controller/rotor_controller.py --esp32 192.168.0.50 --demo
```

## Como conectar ao app

O controlador usa o **mesmo motor orbital (Skyfield/SGP4)** que o app OrbitHam e
o módulo de análise, então os ângulos batem com o que aparece no card de
"Apontamento da antena". O ESP32 expõe `POST /point` com CORS liberado, então o
próprio frontend poderia enviar os ângulos direto para o rotor (extensão
opcional).

## Roteiro para o vídeo (uns 45s)

1. Mostre o card de apontamento no app (AZ/EL/Doppler).
2. Rode o controlador em `--demo` apontando para o IP do ESP32.
3. Filme os **servos movendo o ponteiro** pelo arco enquanto o terminal imprime
   os ângulos. O LED acende quando "visível".
4. Explique a decisão: "o mesmo cálculo do app comanda o hardware via Wi-Fi".

## Limitações (assumidas)

- Servos comuns cobrem ~180°, então o azimute 0–360 é **mapeado para 0–180** no
  protótipo (perde resolução). Um rotor real usa base contínua ou motor de passo
  com engrenagem.
- Sem realimentação de posição. Extensão natural: um **sensor IMU/magnetômetro**
  na antena devolvendo a orientação real para corrigir o erro de apontamento.
