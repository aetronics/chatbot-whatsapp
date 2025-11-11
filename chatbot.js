// chatbot.js

// 📱 Lector de código QR / Leitor de QR Code
const qrcode = require('qrcode-terminal');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

// 🚀 Log inicial para depuração
console.log("🚀 Bot iniciado, aguardando conexão com WhatsApp...");

// ⏱️ Função de atraso
const delay = ms => new Promise(res => setTimeout(res, ms));

// 🧠 Memória simples para menu
const usuariosConMenu = new Set();

// 🌐 Servidor Express para Render
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('🤖 Bot WhatsApp da Aetronics está activo e rodando.'));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Health server listening on port ${PORT}`));

(async () => {
  try {
    const executablePath = await chromium.executablePath();

    // ⚙️ Configuração Chromium otimizada para Render + Node 25
    const baseArgs = [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
      '--no-zygote',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-features=site-per-process,TranslateUI',
      '--disable-breakpad',
      '--window-size=1920,1080'
    ];

    const client = new Client({
      authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '.wwebjs_auth')
      }),
      puppeteer: {
        headless: true,
        executablePath,
        args: baseArgs,
        ignoreHTTPSErrors: true,
        defaultViewport: chromium.defaultViewport
      }
    });

    // 📲 Exibe QR code no terminal
    client.on('qr', qr => {
      console.log('📱 Escanee este QR / Escaneie este QR com o WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    client.on('authenticated', () => console.log('🔐 Sessão autenticada / Sesión autenticada'));
    client.on('ready', () => console.log('✅ Tudo certo! WhatsApp conectado.'));
    client.on('disconnected', reason => console.log('⚠️ Cliente desconectado:', reason));
    client.on('auth_failure', msg => console.error('❌ Falha na autenticação:', msg));

    async function enviarMenu(msg) {
      const chat = await msg.getChat();
      await delay(1000);
      await chat.sendStateTyping();
      await delay(1000);

      const contact = await msg.getContact();
      const name = contact.pushname ? contact.pushname.split(" ")[0] : '';

      await client.sendMessage(
        msg.from,
        `👋 ¡Hola ${name}! Soy el *Agente AE* de la empresa *Aetronics*.\n\n` +
        `❓ ¿En qué puedo ayudarle hoy? Por favor, escriba una de las siguientes opciones:\n\n` +
        `1️⃣ - Reparación de centralitas\n` +
        `2️⃣ - Reparación de llaves\n` +
        `3️⃣ - Duplicado de llave\n` +
        `4️⃣ - Reprogramación de EGR, AdBlue, DPF o aumento de potencia\n` +
        `5️⃣ - Reparación de EZS Mercedes\n` +
        `6️⃣ - Reparación de ABS\n` +
        `7️⃣ - Reparación de ECU de airbag – Clear\n` +
        `8️⃣ - Reparación de cuadro de instrumentos\n` +
        `9️⃣ - Consulta sobre reparaciones pendientes\n` +
        `🔟 - Otras reparaciones\n` +
        `0️⃣ - Volver atrás\n\n` +
        `🕑 Horario: lun-jue 8:30-14:00 / 15:00-18:00, viernes 8:30-14:30\n` +
        `📞 Teléfono: 10:00-14:00 / 16:00-17:30\n` +
        `💡 Si este mensaje ya fue enviado, ignore por favor.`
      );

      usuariosConMenu.add(msg.from);
    }

    async function responder(msg, texto) {
      const chat = await msg.getChat();
      await delay(1000);
      await chat.sendStateTyping();
      await delay(1000);
      await client.sendMessage(msg.from, texto);
    }

    client.on('message', async msg => {
      try {
        console.log(`📩 Mensagem recebida de ${msg.from}: ${msg.body}`);
        const body = (msg.body || '').toLowerCase().trim();
        const from = msg.from || '';

        if (!from.endsWith('@c.us')) return;

        if (
          body.match(/\b(buen|buenos|menu|menú|dias|tardes|quiero|puedo|tengo|noches|consulta|horario|hola|olá)\b/i) &&
          !/^[0-9]+$/.test(body) &&
          !usuariosConMenu.has(from)
        ) {
          console.log(`🤖 Enviando menu para ${from}`);
          await enviarMenu(msg);
          return;
        }

        if (body === '0') {
          usuariosConMenu.delete(from);
          await enviarMenu(msg);
          return;
        }

        const respuestas = {
          '1': '📌 Para poder ayudarle, voy a necesitar:\n- Ficha técnica\n- Foto de la centralita\n- Diagnosis del vehículo con los DTC (errores)\n\n📩 Mensaje automático.',
          '2': '📌 Por favor, envíe:\n- Ficha técnica\n- Fotos de la llave\n- Fallos que presenta la llave\n\n📩 Mensaje automático.',
          '3': '📌 Por favor, envíe:\n- Ficha técnica\n- Fotos de la llave\n\n📩 Mensaje automático.',
          '4': '📌 Por favor, envíe:\n- Ficha técnica\n- Diagnosis del vehículo\n\n📩 Mensaje automático.',
          '5': '📌 Por favor, envíe:\n- Ficha técnica\n- Diagnosis del vehículo\n\n📩 Mensaje automático.',
          '6': '📌 Por favor, envíe:\n- Ficha técnica\n- Diagnosis del vehículo\n\n📩 Mensaje automático.',
          '7': '📌 Por favor, envíe:\n- Ficha técnica\n- Diagnóstico con DTC del airbag\n- Foto de la centralita\n\n📩 Mensaje automático.',
          '8': '📌 Por favor, envíe:\n- Ficha técnica\n- Descripción de errores del cuadro\n\n📩 Mensaje automático.',
          '9': '📌 Por favor, envíe:\n- Su nombre completo\n- Número de orden\n\n📩 Mensaje automático.',
          '10': '📌 Por favor, describa brevemente el tipo de reparación o problema.\n\n📩 Mensaje automático.'
        };

        if (respuestas[body]) {
          console.log(`📤 Respondendo com a opção ${body} para ${from}`);
          await responder(msg, respuestas[body]);
          return;
        }

        if (body.includes('menu') || body.includes('volver')) {
          usuariosConMenu.delete(from);
          await client.sendMessage(from, '🔄 Menú reiniciado. Escriba "hola" o "buenas" para ver las opciones otra vez.');
        }
      } catch (err) {
        console.error('Erro no handler de mensagem:', err);
      }
    });

    await client.initialize();

  } catch (err) {
    console.error('💥 Erro crítico na inicialização do bot:', err);
  }
})();
