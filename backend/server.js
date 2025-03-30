const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

// Configuración mejorada para Koyeb
const io = new Server(server, {
  cors: {
    origin: "inclined-irene-bubbletalk17-e46c6423.koyeb.app/", // Cambiar por tu URL frontend en producción
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
    skipMiddlewares: true
  }
});

// Middleware para evitar hibernación
app.use((req, res, next) => {
  req.socket.setKeepAlive(true);
  next();
});

// Health Check Endpoint (Requerido por Koyeb)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ... (resto de tu lógica de sockets)

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on Koyeb, PORT: ${PORT}`);
});