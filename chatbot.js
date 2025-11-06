// chatbot.js

// 📱 Lector de código QR / Leitor de QR Code
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { Client, Buttons, List, MessageMedia, LocalAuth } = require('whatsapp-web.js');

// 🚀 Log inicial para depuración / Log inicial para depuração
console.log("🚀 Bot iniciado, aguardando conexão com WhatsApp...");

// 📂 Caminho do arquivo de sessão / Ruta del archivo de sesión
const SESSION_FILE_PATH = './session.json';

// 🔐 Carregar a sessão se existir / Cargar la sesión si existe
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

// ✅ Configuração do cliente com sessão persistente / Configuración del cliente con sesión persistente
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: require('puppeteer').executablePath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});


// 📲 Geração do código QR / Generación del código QR
client.on('qr', qr => {
    console.log('📱 Escanee este código QR con su WhatsApp / 📱 Escaneie este QR com o seu WhatsApp');
    qrcode.generate(qr, { small: true });
});

// 💾 Salvar sessão ao conectar / Guardar sesión al conectar
client.on('authenticated', session => {
    console.log('🔐 Sesión autenticada / 🔐 Sessão autenticada');
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session));
});

// ✅ Confirmação da conexão / Confirmación de conexión
client.on('ready', () => {
    console.log('✅ ¡Todo correcto! WhatsApp conectado. / ✅ Tudo certo! WhatsApp conectado.');
});

// ⚠️ Cliente desconectado / ⚠️ Cliente desconectado
client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente desconectado: ', reason);
});

// ❌ Falha de autenticação / ❌ Fallo de autenticación
client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação: ', msg);
});

// ⏱️ Função para criar atraso / Función para crear retardo
const delay = ms => new Promise(res => setTimeout(res, ms));

// 🧠 Memória simples: guarda números que já receberam o menu / Memoria simple: guarda números que ya recibieron el menú
const usuariosConMenu = new Set();

// 📋 Função para enviar o menu inicial / Función para enviar el menú inicial
async function enviarMenu(msg) {
    const chat = await msg.getChat();
    await delay(1000);
    await chat.sendStateTyping(); // simula digitação / simula escritura
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
        `🕑 El horario es de lunes a jueves: 8:30 a 14:00 y de 15:00 a 18:00. Los viernes de 8:30 a 14:30\n\n` +
        `📞 Nuestro horario de atención telefónica es de 10:00 a 14:00 - 16:00 a 17:30\n\n` +
        `💡 Si este mensaje ya ha sido enviado, por favor ignore.`
    );

    usuariosConMenu.add(msg.from);
}

// 💬 Evento principal de mensagens / Evento principal de mensajes
client.on('message', async msg => {
    console.log(`📩 Mensagem recebida de ${msg.from}: ${msg.body}`);

    const body = msg.body.toLowerCase().trim();
    const from = msg.from;

    // 🚫 Ignorar mensagens de grupos / Ignorar mensajes de grupos
    if (!from.endsWith('@c.us')) return;

    // --- 1️⃣ DETEÇÃO DE SAUDAÇÕES / DETECCIÓN DE SALUDOS ---
    if (
        body.match(/\b(buen|buenos|menu|menú|días|dias|tardes|quiero|puedo|tengo|noches|consulta|horario|horário|hola|olá)\b/i) &&
        !/^[0-9]+$/.test(body) &&
        !usuariosConMenu.has(from)
    ) {
        console.log(`🤖 Enviando menu para ${from}`);
        await enviarMenu(msg);
        return;
    }

    // --- 2️⃣ OPÇÃO VOLTAR ATRÁS / OPCIÓN VOLVER ATRÁS ---
    if (body === '0') {
        usuariosConMenu.delete(from);
        await enviarMenu(msg);
        return;
    }

    // --- 3️⃣ OPÇÕES NUMÉRICAS / OPCIONES NUMÉRICAS ---
    const respuestas = {
        '1': '📌 Para poder ayudarle, voy a necesitar:\n- Ficha técnica\n- Foto de la centralita\n- Diagnosis del vehículo con los DTC (errores)\n\n📩 Este es un mensaje enviado automáticamente.',
        '2': '📌 Por favor, envíe:\n- Ficha técnica\n- Fotos de la llave\n- Fallos que presenta la llave\n\n📩 Este es un mensaje enviado automáticamente.',
        '3': '📌 Por favor, envíe:\n- Ficha técnica\n- Fotos de la llave\n\n📩 Este es un mensaje enviado automáticamente.',
        '4': '📌 Por favor, envíe:\n- Ficha técnica\n- Diagnosis del vehículo\n\n📩 Este es un mensaje enviado automáticamente.',
        '5': '📌 Por favor, envíe:\n- Ficha técnica\n- Diagnosis del vehículo\n\n📩 Este es un mensaje enviado automáticamente.',
        '6': '📌 Por favor, envíe:\n- Ficha técnica\n- Diagnosis del vehículo\n\n📩 Este es un mensaje enviado automaticamente.',
        '7': '📌 Por favor, envíe:\n- Ficha técnica\n- Diagnóstico con los DTC del airbag\n- Foto de la centralita\n\n📩 Este es un mensaje enviado automáticamente.',
        '8': '📌 Por favor, envíe:\n- Ficha técnica\n- Descripción de los errores del cuadro (si es posible, vídeo)\n\n📩 Este es un mensaje enviado automáticamente.',
        '9': '📌 Por favor, envíe:\n- Su nombre completo\n- Número de orden\n\n📩 Este es un mensaje enviado automáticamente.',
        '10': '📌 Por favor, describa brevemente el tipo de reparación o problema.\n\n📩 Este es un mensaje enviado automáticamente.'
    };

    if (respuestas[body]) {
        console.log(`📤 Respondendo com a opção ${body} para ${from}`);
        await responder(msg, respuestas[body]);
        return;
    }

    // --- 4️⃣ REINÍCIO DO MENU / REINICIO DEL MENÚ ---
    if (body.includes('menu') || body.includes('volver')) {
        usuariosConMenu.delete(from);
        await client.sendMessage(from, '🔄 Menú reiniciado. Escriba "hola" o "buenas" para ver las opciones otra vez.');
    }
});

// ⚙️ Função auxiliar de resposta / Función auxiliar de respuesta
async function responder(msg, texto) {
    const chat = await msg.getChat();
    await delay(1000);
    await chat.sendStateTyping();
    await delay(1000);
    await client.sendMessage(msg.from, texto);
}

// 🚀 Inicializa o cliente (importante para PM2) / Inicializa el cliente (importante para PM2)
client.initialize();

// 💾 Mantém o processo vivo no PM2 / Mantiene el proceso vivo en PM2
process.on('uncaughtException', (err) => {
    console.error('⚠️ Exceção não tratada / ⚠️ Excepción no controlada:', err);
});
