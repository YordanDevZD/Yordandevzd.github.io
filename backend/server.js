const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);

// Configurar CORS para permitir tu frontend en Render
const io = new Server(server, {
  cors: {
    origin: 'https://yordandevzd-github-io.onrender.com', // Cambia esto a la URL de tu frontend en producción
    methods: ['GET', 'POST'],
  },
});

// Almacenar mensajes en memoria (para el ejemplo)
let messages = [];

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Enviar mensajes anteriores al nuevo usuario
  socket.emit('previous-messages', messages);

  // Escuchar nuevos mensajes
  socket.on('send-message', (data) => {
    messages.push(data);
    io.emit('new-message', data); // Enviar a todos los clientes
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});