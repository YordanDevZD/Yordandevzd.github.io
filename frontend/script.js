// Conectar al servidor Socket.io
const socket = io('https://chat-backend-bpnz.onrender.com');

// Elementos del DOM
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');

// Pedir nombre de usuario
const user = prompt('¿Cuál es tu nombre?') || 'Anónimo';

// Variable para controlar mensajes pendientes
let pendingMessages = new Set();

// Enviar el nombre de usuario al servidor
socket.emit('set-username', user);

// Función para formatear texto con saltos de línea automáticos
function formatText(text) {
    const maxCharsPerLine = 45;
    let result = '';
    let currentLineLength = 0;

    // Conservar saltos de línea existentes primero
    const paragraphs = text.split('\n');
    
    paragraphs.forEach((paragraph, pIndex) => {
        if (pIndex > 0) result += '\n';
        
        const words = paragraph.split(' ');
        words.forEach(word => {
            if (currentLineLength + word.length > maxCharsPerLine) {
                result += '\n';
                currentLineLength = 0;
            } else if (currentLineLength > 0) {
                result += ' ';
                currentLineLength++;
            }
            result += word;
            currentLineLength += word.length;
        });
    });

    return result;
}

// Función para crear elementos de mensaje
function createMessageElement(data, isSent = true) {
    const messageElement = document.createElement('div');
    const isServerMessage = data.user === 'SERVIDOR';
    
    messageElement.classList.add('message', 
        isServerMessage ? 'server' : 
        isSent ? 'sent' : 'received');
    
    const time = new Date(data.time).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const formattedText = formatText(data.text).replace(/\n/g, '<br>');

    messageElement.innerHTML = `
        <div class="message-info">
            <span class="message-user">${isServerMessage ? data.user : (isSent ? 'Tú' : data.user)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${formattedText}</div>
    `;

    if (data.id) {
        messageElement.dataset.messageId = data.id;
    }

    return messageElement;
}

// Escuchar nuevos mensajes del servidor
socket.on('new-message', (data) => {
    if (data.user === user && pendingMessages.has(data.id)) {
        pendingMessages.delete(data.id);
        return;
    }
    
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
        const cleanedText = text.replace(/\s+/g, ' ').replace(/\n+/g, '\n');
        
        const messageData = {
            user,
            text: cleanedText,
            id: Date.now().toString(),
            time: new Date().toISOString()
        };
        
        pendingMessages.add(messageData.id);
        const messageElement = createMessageElement(messageData, true);
        messagesDiv.appendChild(messageElement);
        scrollToBottom();
        
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
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Permitir Shift+Enter para saltos de línea manuales
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        messageInput.value += '\n';
    }
});