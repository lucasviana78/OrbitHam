/*
 * OrbitHam - Rotor de antena azimute/elevacao (ESP32)
 * Global Solution FIAP
 *
 * Recebe angulos de apontamento (azimute/elevacao) por Wi-Fi e move dois
 * servos para apontar uma antena/ponteiro para o satelite. Fecha o ciclo
 * software -> hardware: o app/controlador calcula AZ/EL e o ESP32 aponta.
 *
 * Protocolo (HTTP, sem dependencia de JSON):
 *   POST /point   corpo form: az=142.0&el=23.0&visible=1   -> move os servos
 *   GET  /status  -> JSON com o ultimo apontamento
 *   GET  /        -> pagina de status simples
 *
 * Bibliotecas (Arduino IDE):
 *   - Placa: "ESP32 Dev Module" (gerenciador de placas Espressif)
 *   - ESP32Servo (Library Manager)
 *
 * Ligacao (pinos padrao abaixo):
 *   Servo AZIMUTE  -> GPIO 13   (sinal)
 *   Servo ELEVACAO -> GPIO 12   (sinal)
 *   Servos: VCC em 5V (fonte externa recomendada), GND comum com o ESP32
 *   LED onboard (GPIO 2) acende quando o satelite esta visivel (el >= 0)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

// ------------------------- CONFIGURACAO -------------------------
const char *WIFI_SSID = "SUA_REDE_WIFI";
const char *WIFI_PASS = "SUA_SENHA_WIFI";

const int AZ_PIN = 13;   // servo de azimute
const int EL_PIN = 12;   // servo de elevacao
const int LED_PIN = 2;   // LED onboard (indica "visivel")

// Limites mecanicos dos servos (graus de servo).
const int SERVO_MIN = 0;
const int SERVO_MAX = 180;
// ----------------------------------------------------------------

WebServer server(80);
Servo azServo;
Servo elServo;

float lastAz = 0.0f;
float lastEl = 0.0f;
bool lastVisible = false;

int clampInt(int v, int lo, int hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

// Aplica o apontamento aos servos.
// Demo: azimute 0..360 mapeado para 0..180 do servo (um servo comum nao
// cobre 360). Em um rotor real usa-se base continua / motor de passo.
void applyPointing(float az, float el, bool visible) {
  while (az < 0) az += 360.0f;
  while (az >= 360.0f) az -= 360.0f;
  if (el < 0) el = 0;
  if (el > 90) el = 90;

  int azServoDeg = clampInt((int)(az * SERVO_MAX / 360.0f), SERVO_MIN, SERVO_MAX);
  int elServoDeg = clampInt((int)(el * 2.0f), SERVO_MIN, SERVO_MAX); // 0..90 -> 0..180

  azServo.write(azServoDeg);
  elServo.write(elServoDeg);
  digitalWrite(LED_PIN, visible ? HIGH : LOW);

  lastAz = az;
  lastEl = el;
  lastVisible = visible;

  Serial.printf("AZ %.1f (servo %d)  EL %.1f (servo %d)  visivel=%d\n",
                az, azServoDeg, el, elServoDeg, visible);
}

void sendCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handlePoint() {
  sendCors();
  if (!server.hasArg("az") || !server.hasArg("el")) {
    server.send(400, "application/json", "{\"erro\":\"faltam az/el\"}");
    return;
  }
  float az = server.arg("az").toFloat();
  float el = server.arg("el").toFloat();
  bool visible = server.hasArg("visible") && server.arg("visible") == "1";
  applyPointing(az, el, visible);

  char body[96];
  snprintf(body, sizeof(body),
           "{\"az\":%.1f,\"el\":%.1f,\"visible\":%s}",
           lastAz, lastEl, lastVisible ? "true" : "false");
  server.send(200, "application/json", body);
}

void handleStatus() {
  sendCors();
  char body[96];
  snprintf(body, sizeof(body),
           "{\"az\":%.1f,\"el\":%.1f,\"visible\":%s}",
           lastAz, lastEl, lastVisible ? "true" : "false");
  server.send(200, "application/json", body);
}

void handleRoot() {
  char html[512];
  snprintf(html, sizeof(html),
           "<html><head><meta charset='utf-8'><title>OrbitHam Rotor</title></head>"
           "<body style='font-family:sans-serif;background:#0b1020;color:#e2e8f0'>"
           "<h2>OrbitHam - Rotor de antena</h2>"
           "<p>Azimute: <b>%.1f&deg;</b></p>"
           "<p>Elevacao: <b>%.1f&deg;</b></p>"
           "<p>Visivel: <b>%s</b></p>"
           "<p style='color:#94a3b8'>POST /point  (az, el, visible)</p>"
           "</body></html>",
           lastAz, lastEl, lastVisible ? "sim" : "nao");
  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  azServo.setPeriodHertz(50);
  elServo.setPeriodHertz(50);
  azServo.attach(AZ_PIN, 500, 2400);
  elServo.attach(EL_PIN, 500, 2400);
  applyPointing(0, 0, false);

  Serial.printf("\nConectando ao Wi-Fi %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.printf("\nConectado. IP do rotor: %s\n", WiFi.localIP().toString().c_str());

  server.on("/", HTTP_GET, handleRoot);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/point", HTTP_POST, handlePoint);
  server.on("/point", HTTP_OPTIONS, []() { sendCors(); server.send(204); });
  server.begin();
  Serial.println("Servidor HTTP iniciado.");
}

void loop() {
  server.handleClient();
}
