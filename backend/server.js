const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);

// Configurar CORS
const io = new Server(server, {
  cors: {
    origin: 'https://yordandevzd-github-io.onrender.com',
    methods: ['GET', 'POST'],
  },
});

let messages = [];
const messageRegistry = new Set();

// Función para crear mensajes del servidor
function createServerMessage(text) {
  return {
    id: `server-${Date.now()}`,
    user: 'SERVIDOR',
    text: text,
    time: new Date().toISOString(),
    isServerMessage: true
  };
}

io.on('connection', (socket) => {
  // Obtener nombre de usuario (puedes enviarlo desde el cliente al conectar)
  let username = 'Anónimo';
  
  // Escuchar cuando el cliente envíe su nombre de usuario
  socket.on('set-username', (name) => {
    username = name || 'Anónimo';
    
    // Crear y enviar mensaje de conexión
    const connectionMessage = createServerMessage(`Usuario ${username} se ha unido a la conversación`);
    
    // Guardar y difundir el mensaje
    messages.push(connectionMessage);
    io.emit('new-message', connectionMessage);
    
    console.log(`Usuario conectado: ${username} (${socket.id})`);
  });

  // Enviar historial de mensajes
  socket.emit('previous-messages', messages);

  socket.on('send-message', (data) => {
    if (messageRegistry.has(data.id)) return;
    
    if (!data.id || !data.user || !data.text || !data.time) {
      console.error('Mensaje inválido:', data);
      return;
    }

    messageRegistry.add(data.id);
    messages.push(data);
    
    if (messages.length > 100) messages.shift();
    
    io.emit('new-message', data);
  });

  socket.on('disconnect', () => {
    if (username) {
      const disconnectMessage = createServerMessage(`Usuario ${username} ha abandonado la conversación`);
      messages.push(disconnectMessage);
      io.emit('new-message', disconnectMessage);
    }
    console.log(`Usuario desconectado: ${username || 'Anónimo'} (${socket.id})`);
  });

  // Limpieza periódica
  setInterval(() => {
    const now = Date.now();
    messages = messages.filter(msg => {
      const msgTime = new Date(msg.time).getTime();
      return (now - msgTime) < 3600000; // 1 hora
    });
  }, 3600000);
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    messageCount: messages.length,
    activeConnections: io.engine.clientsCount
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});