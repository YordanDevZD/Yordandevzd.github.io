// Reemplaza con la URL de tu backend en Render
const socket = io('https://tu-backend.onrender.com');

// Elementos del DOM
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');

// Pedir nombre de usuario
const user = prompt('¿Cuál es tu nombre?') || 'Anónimo';

// Escuchar mensajes
socket.on('new-message', (data) => {
  const messageElement = document.createElement('div');
  messageElement.textContent = `${data.user}: ${data.text}`;
  messagesDiv.appendChild(messageElement);
});

socket.on('previous-messages', (msgs) => {
  msgs.forEach(msg => {
    const messageElement = document.createElement('div');
    messageElement.textContent = `${msg.user}: ${msg.text}`;
    messagesDiv.appendChild(messageElement);
  });
});

// Enviar mensaje
function sendMessage() {
  const text = messageInput.value.trim();
  if (text) {
    socket.emit('send-message', { user, text });
    messageInput.value = '';
  }
}