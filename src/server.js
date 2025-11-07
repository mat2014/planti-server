// =====================================================================
// 🌿 SERVIDOR EXPRESS + MQTT + SOCKET.IO + CRUD COMPLETO + LOGIN
// =====================================================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mqtt = require('mqtt');
const http = require('http');
const { Server } = require('socket.io');

// =====================================================================
// CONFIGURAÇÕES BÁSICAS
// =====================================================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = 3000;

app.use(express.json());
app.use(cors());

// =====================================================================
// 📁 CAMINHOS DOS “BANCOS DE DADOS” LOCAIS (arquivos .json)
// =====================================================================
const PLANTS_DB_PATH = path.join(__dirname, 'plants.json');
const TASKS_DB_PATH = path.join(__dirname, 'tasks.json');
const USERS_DB_PATH = path.join(__dirname, 'users.json');

// Helpers para ler/gravar arquivos
const readDB = (file) => {
  if (!fs.existsSync(file)) return [];
  const data = fs.readFileSync(file, 'utf8');
  return data ? JSON.parse(data) : [];
};
const writeDB = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// =====================================================================
// 🔌 MQTT (ESP32 → Servidor → App)
// =====================================================================
const MQTT_BROKER_URL = 'mqtt://broker.hivemq.com';
const MQTT_PLANT_ID = 'plantA';

const MQTT_TOPICS = {
  temperatura: `horta/${MQTT_PLANT_ID}/temperatura`,
  umidade_ar: `horta/${MQTT_PLANT_ID}/umidade_ar`,
  umidade_solo: `horta/${MQTT_PLANT_ID}/umidade_solo`,
};

let lastSensorData = {
  temperatura: null,
  umidade_ar: null,
  umidade_solo: null,
  timestamp: null,
};

// Conecta ao broker MQTT
const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on('connect', () => {
  console.log(`🌱 Conectado ao Broker MQTT em ${MQTT_BROKER_URL}`);
  mqttClient.subscribe(Object.values(MQTT_TOPICS), (err) => {
    if (err) {
      console.error('❌ Erro ao se inscrever nos tópicos:', err);
    } else {
      console.log('📡 Inscrito nos tópicos:', Object.values(MQTT_TOPICS));
    }
  });
});

// Recebe mensagens do ESP32
mqttClient.on('message', (topic, message) => {
  const payload = parseFloat(message.toString());
  const now = new Date().toISOString();

  if (topic === MQTT_TOPICS.temperatura) {
    lastSensorData.temperatura = payload;
    console.log(`🌡️ Temperatura: ${payload} °C`);
  } else if (topic === MQTT_TOPICS.umidade_ar) {
    lastSensorData.umidade_ar = payload;
    console.log(`💧 Umidade do Ar: ${payload} %`);
  } else if (topic === MQTT_TOPICS.umidade_solo) {
    lastSensorData.umidade_solo = payload;
    console.log(`🌱 Umidade do Solo: ${payload} %`);
  }

  lastSensorData.timestamp = now;

  // 🚀 Envia para o app via WebSocket
  io.emit('mqtt_update', lastSensorData);
});

// =====================================================================
// 🌐 SOCKET.IO — Envia dados em tempo real para o app
// =====================================================================
io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado via WebSocket');
  socket.emit('mqtt_update', lastSensorData);

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado do WebSocket');
  });
});

// =====================================================================
// 🌱 CRUD DE PLANTAS
// =====================================================================
app.get('/plants', (req, res) => {
  try {
    res.json(readDB(PLANTS_DB_PATH));
  } catch {
    res.status(500).json({ message: 'Erro ao ler as plantas.' });
  }
});

app.post('/plants', (req, res) => {
  const { nome, local } = req.body;
  if (!nome || !local)
    return res.status(400).json({ message: 'Nome e local são obrigatórios.' });

  try {
    const plants = readDB(PLANTS_DB_PATH);
    const newPlant = { id: Date.now().toString(), nome, local };
    plants.push(newPlant);
    writeDB(PLANTS_DB_PATH, plants);
    res.status(201).json(newPlant);
  } catch {
    res.status(500).json({ message: 'Erro ao salvar planta.' });
  }
});

app.delete('/plants/:id', (req, res) => {
  const { id } = req.params;
  try {
    const plants = readDB(PLANTS_DB_PATH);
    const updated = plants.filter((p) => p.id !== id);
    if (updated.length === plants.length)
      return res.status(404).json({ message: 'Planta não encontrada.' });
    writeDB(PLANTS_DB_PATH, updated);
    res.sendStatus(200);
  } catch {
    res.status(500).json({ message: 'Erro ao excluir planta.' });
  }
});

// =====================================================================
// ✅ CRUD DE TAREFAS
// =====================================================================
app.get('/tasks', (req, res) => {
  try {
    const tasks = readDB(TASKS_DB_PATH);
    res.json(tasks.sort((a, b) => b.id.localeCompare(a.id)));
  } catch {
    res.status(500).json({ message: 'Erro ao ler tarefas.' });
  }
});

app.post('/tasks', (req, res) => {
  const { texto, concluido } = req.body;
  if (!texto)
    return res.status(400).json({ message: 'O campo "texto" é obrigatório.' });

  try {
    const tasks = readDB(TASKS_DB_PATH);
    const newTask = {
      id: Date.now().toString(),
      texto,
      concluido: concluido ?? false,
    };
    tasks.push(newTask);
    writeDB(TASKS_DB_PATH, tasks);
    res.status(201).json(newTask);
  } catch {
    res.status(500).json({ message: 'Erro ao salvar tarefa.' });
  }
});

// =====================================================================
// 👤 REGISTRO DE USUÁRIOS
// =====================================================================
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Preencha todos os campos.' });

  try {
    const users = readDB(USERS_DB_PATH);
    if (users.find((u) => u.email === email))
      return res.status(409).json({ message: 'E-mail já cadastrado.' });

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeDB(USERS_DB_PATH, users);
    console.log(`👤 Novo usuário registrado: ${email}`);
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch {
    res.status(500).json({ message: 'Erro ao salvar usuário.' });
  }
});

// =====================================================================
// 🔑 LOGIN DE USUÁRIO (para o App)
// =====================================================================
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });

  try {
    const users = readDB(USERS_DB_PATH);
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user)
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });

    console.log(`🔐 Login bem-sucedido: ${email}`);
    res.json({
      message: 'Login realizado com sucesso!',
      user: { name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ message: 'Erro ao processar login.' });
  }
});

// =====================================================================
// 🌡️ ROTA PARA CONSULTAR OS ÚLTIMOS DADOS MQTT (GET /mqtt-data)
// =====================================================================
app.get('/mqtt-data', (req, res) => {
  if (!lastSensorData.timestamp)
    return res.status(404).json({ message: 'Sem dados MQTT ainda.' });
  res.json(lastSensorData);
});
// =====================================================================
// 💧 ROTA: Acionar irrigação via MQTT
// =====================================================================
app.post('/water-plant', (req, res) => {
  const topic = `horta/${MQTT_PLANT_ID}/regar`;
  mqttClient.publish(topic, '1'); // envia comando para ESP32
  console.log(`🚿 Comando de irrigação enviado para ${topic}`);
  res.json({ message: 'Irrigação acionada com sucesso!' });
});

// =====================================================================
// 🚀 ROTA DE STATUS
// =====================================================================
app.get('/', (req, res) => {
  res.json({ message: '🌿 API de Horta Inteligente ativa!' });
});

// =====================================================================
// INICIAR SERVIDOR
// =====================================================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
