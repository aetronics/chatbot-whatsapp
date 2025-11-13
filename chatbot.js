// chatbot.js — versão 24h otimizada para Render (Node 25)

const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const express = require('express');
const axios = require('axios');
const { Client, LocalAuth } = require('whatsapp-web.js');

console.log("🚀 Iniciando bot da Aetronics...");

const delay = ms => new Promise(res => setTimeout(res, ms));
const usuariosConMenu = new Set();
let ultimoQR = null;
let client;

// === Função que inicia o cliente WhatsApp ===
async function startBot() {
  try {
    const executablePath = (await chromium.executablePath()) || '/usr/bin/google-chrome';

    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--no-zygote',
      '--single-process',
      '--mute-audio',
      '--disable-background-networking',
      '--disable-breakpad',
      '--window-size=1280,720'
    ];

    client = new Client({
      authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
      puppeteer: {
        headless: true,
        executablePath,
        args: baseArgs,
        ignoreHTTPSErrors: true
      }
    });

    // ===== EVENTOS PRINCIPAIS =====
    client.on('qr', qr => {
      ultimoQR = qr;
      console.log('📱 Escaneie este QR no WhatsApp');
      qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', () => console.log('🔐 Sessão autenticada'));
    client.on('ready', () => console.log('✅ WhatsApp conectado e funcional.'));
    client.on('disconnected', async reason => {
      console.log('⚠️ Desconectado:', reason);
      console.log('♻️ Reiniciando cliente em 10s...');
      await delay(10000);
      startBot(); // reinicia automaticamente
    });

    client.on('auth_failure', msg => console.error('❌ Falha na autenticação:', msg));

    const respostas = {
      '1': '📌 Envíe: ficha técnica + foto centralita + diagnosis con DTC.',
      '2': '📌 Envíe: ficha técnica + fotos de la llave + descripción de fallos.',
      '3': '📌 Envíe: ficha técnica + fotos de la llave.',
      '4': '📌 Envíe: ficha técnica + diagnosis del vehículo.',
      '5': '📌 Envíe: ficha técnica + diagnosis.',
      '6': '📌 Envíe: ficha técnica + diagnosis.',
      '7': '📌 Envíe: ficha técnica + DTC airbag + foto ECU.',
      '8': '📌 Envíe: ficha técnica + descripción de fallos del cuadro.',
      '9': '📌 Envíe: nombre completo + número de orden.',
      '10': '📌 Describa brevemente el tipo de reparación o problema.'
    };

    async function enviarMenu(msg) {
      const chat = await msg.getChat();
      await chat.sendStateTyping();
      const contact = await msg.getContact();
      const name = contact.pushname ? contact.pushname.split(" ")[0] : '';
      await client.sendMessage(
        msg.from,
        `👋 ¡Hola ${name}! Soy el *Agente AE* de *Aetronics*.\n\nSeleccione una opción:\n\n` +
        `1️⃣ - Reparación de centralitas\n` +
        `2️⃣ - Reparación de llaves\n` +
        `3️⃣ - Duplicado de llave\n` +
        `4️⃣ - Reprogramación EGR / AdBlue / DPF / potencia\n` +
        `5️⃣ - Reparación EZS Mercedes\n` +
        `6️⃣ - Reparación ABS\n` +
        `7️⃣ - Airbag ECU (Clear)\n` +
        `8️⃣ - Cuadro de instrumentos\n` +
        `9️⃣ - Reparaciones pendientes\n` +
        `🔟 - Otras reparaciones\n` +
        `0️⃣ - Volver atrás\n\n` +
        `🕑 Horario: lun-jue 8:30-18:00 / vie 8:30-14:30\n📞 Tel: 10:00-14:00 / 16:00-17:30`
      );
      usuariosConMenu.add(msg.from);
    }

    client.on('message', async msg => {
      try {
        const body = (msg.body || '').toLowerCase().trim();
        const from = msg.from || '';
        if (!from.endsWith('@c.us')) return;

        if (
          body.match(/\b(hola|olá|menu|menú|buenas|consulta|quiero|puedo|tengo)\b/i) &&
          !/^[0-9]+$/.test(body) &&
          !usuariosConMenu.has(from)
        ) return enviarMenu(msg);

        if (body === '0') {
          usuariosConMenu.delete(from);
          return enviarMenu(msg);
        }

        if (respostas[body]) return client.sendMessage(msg.from, respostas[body]);

      } catch (err) {
        console.error('Erro no handler de mensagem:', err);
      }
    });

    await client.initialize();
  } catch (err) {
    console.error('💥 Erro crítico:', err);
    console.log('♻️ Reiniciando bot em 15 segundos...');
    setTimeout(startBot, 15000);
  }
}

// === Servidor Express para Render ===
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('🤖 Bot WhatsApp da Aetronics está ativo e rodando.'));
app.get('/qr', (req, res) => {
  if (!ultimoQR) return res.send('Nenhum QR gerado ainda.');
  res.send(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
  <h2>📱 Escaneie o QR com o WhatsApp</h2>
  <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(ultimoQR)}&size=250x250" />
  </body></html>`);
});

app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Servidor ativo na porta ${PORT}`));

// === Keep Alive (mantém 24h online) ===
setInterval(async () => {
  try {
    await axios.get(`http://localhost:${PORT}/`);
    console.log('🟢 Ping interno enviado para manter ativo');
  } catch (err) {
    console.log('⚪ Falha no ping interno');
  }
}, 240000); // 4 minutos

// === Inicializa bot ===
startBot();
