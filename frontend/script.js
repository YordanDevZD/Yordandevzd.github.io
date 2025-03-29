// Conectar al servidor Socket.io
const socket = io('https://chat-backend-bpnz.onrender.com');

// Elementos del DOM
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');

// Pedir nombre de usuario
const user = prompt('¿Cuál es tu nombre?') || 'Anónimo';

// Función mejorada para crear elementos de mensaje
function createMessageElement(data, isSent = true) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isSent ? 'sent' : 'received');
    
    const time = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    messageElement.innerHTML = `
        <div class="message-info">
            <span class="message-user">${isSent ? 'Tú' : data.user}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${data.text}</div>
    `;

    return messageElement;
}

// Escuchar nuevos mensajes
socket.on('new-message', (data) => {
    const isSent = data.user === user;
    const messageElement = createMessageElement(data, isSent);
    messagesDiv.appendChild(messageElement);
    scrollToBottom();
});

// Escuchar mensajes anteriores
socket.on('previous-messages', (msgs) => {
    msgs.forEach(msg => {
        const isSent = msg.user === user;
        const messageElement = createMessageElement(msg, isSent);
        messagesDiv.appendChild(messageElement);
    });
    scrollToBottom();
});

// Función para enviar mensaje
function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        const messageData = {
            user,
            text,
            time: new Date().toISOString()
        };
        socket.emit('send-message', messageData);
        
        // Mostrar nuestro mensaje inmediatamente
        const messageElement = createMessageElement(messageData, true);
        messagesDiv.appendChild(messageElement);
        scrollToBottom();
        
        messageInput.value = '';
    }
}

// Función para hacer scroll al final
function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Enviar mensaje al presionar Enter
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});