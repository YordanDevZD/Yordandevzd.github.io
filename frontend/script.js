// Conectar al servidor Socket.io
const socket = io('https://chat-backend-bpnz.onrender.com');

// Elementos del DOM
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');

// Pedir nombre de usuario
const user = prompt('¿Cuál es tu nombre?') || 'Anónimo';

// Variable para controlar mensajes pendientes
let pendingMessages = new Set();

// Función para crear elementos de mensaje
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

    // Agregar ID único al elemento del mensaje
    if (data.id) {
        messageElement.dataset.messageId = data.id;
    }

    return messageElement;
}

// Escuchar nuevos mensajes del servidor
socket.on('new-message', (data) => {
    // Verificar si el mensaje es del usuario actual y ya fue mostrado
    if (data.user === user && pendingMessages.has(data.id)) {
        pendingMessages.delete(data.id);
        return;
    }
    
    const messageElement = createMessageElement(data, data.user === user);
    messagesDiv.appendChild(messageElement);
    scrollToBottom();
});

// Escuchar mensajes anteriores
socket.on('previous-messages', (msgs) => {
    msgs.forEach(msg => {
        const messageElement = createMessageElement(msg, msg.user === user);
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
            id: Date.now().toString(), // ID único para el mensaje
            time: new Date().toISOString()
        };
        
        // Agregar a mensajes pendientes
        pendingMessages.add(messageData.id);
        
        // Mostrar mensaje localmente
        const messageElement = createMessageElement(messageData, true);
        messagesDiv.appendChild(messageElement);
        scrollToBottom();
        
        // Enviar al servidor
        socket.emit('send-message', messageData);
        
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