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

// Almacenar mensajes con estructura mejorada
let messages = [];

// Objeto para control de mensajes duplicados
const messageRegistry = new Set();

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Enviar historial de mensajes
  socket.emit('previous-messages', messages);

  // Manejar nuevos mensajes
  socket.on('send-message', (data) => {
    // Verificar si el mensaje ya fue procesado
    if (messageRegistry.has(data.id)) {
      return;
    }

    // Validar estructura del mensaje
    if (!data.id || !data.user || !data.text || !data.time) {
      console.error('Mensaje con estructura inválida:', data);
      return;
    }

    // Registrar mensaje
    messageRegistry.add(data.id);
    
    // Agregar a historial (limitamos a 100 mensajes)
    messages.push(data);
    if (messages.length > 100) {
      messages.shift(); // Eliminar el mensaje más antiguo
    }

    // Retransmitir con la misma data (incluyendo el ID)
    io.emit('new-message', data);
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });

  // Limpiar registry periódicamente para evitar crecimiento infinito
  setInterval(() => {
    const now = Date.now();
    const oneHour = 3600000;
    
    // Eliminar IDs de mensajes muy antiguos del registry
    messages = messages.filter(msg => {
      const msgTime = new Date(msg.time).getTime();
      return (now - msgTime) < oneHour;
    });
  }, 3600000); // Cada hora
});

// Endpoint de salud para monitoreo
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    messageCount: messages.length,
    activeConnections: io.engine.clientsCount
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
  console.log(`Modo CORS para: https://yordandevzd-github-io.onrender.com`);
});