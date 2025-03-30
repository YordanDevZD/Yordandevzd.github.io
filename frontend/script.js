document.addEventListener('DOMContentLoaded', () => {
    const socket = io('https://tu-app-backend.herokuapp.com');
    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const onlineCount = document.getElementById('online-count');
    
    let user = localStorage.getItem('chat-username') || '';
    let pendingMessages = new Set();
  
    if (!user) {
      user = prompt('Ingresa tu nombre:') || 'Anónimo';
      localStorage.setItem('chat-username', user);
      socket.emit('set-username', user);
    } else {
      socket.emit('set-username', user);
    }
  
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
  
      messageElement.innerHTML = `
        <div class="message-info">
          <span class="message-user">${isServerMessage ? data.user : (isSent ? 'Tú' : data.user)}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${formatText(data.text)}</div>
      `;
  
      return messageElement;
    }
  
    function formatText(text) {
      const maxChars = 45;
      let result = '';
      let currentLine = '';
  
      text.split(' ').forEach(word => {
        if (currentLine.length + word.length > maxChars) {
          result += `<br>${word}`;
          currentLine = word;
        } else {
          result += (currentLine ? ' ' : '') + word;
          currentLine += (currentLine ? ' ' : '') + word;
        }
      });
  
      return result;
    }
  
    socket.on('new-message', (data) => {
      if (pendingMessages.has(data.id)) {
        pendingMessages.delete(data.id);
        return;
      }
      
      const isSent = data.user === user || data.user === 'Tú';
      const messageElement = createMessageElement(data, isSent);
      messagesDiv.appendChild(messageElement);
      scrollToBottom();
    });
  
    socket.on('previous-messages', (msgs) => {
      msgs.forEach(msg => {
        const isSent = msg.user === user;
        const messageElement = createMessageElement(msg, isSent);
        messagesDiv.appendChild(messageElement);
      });
      scrollToBottom();
    });
  
    socket.on('users-count', (count) => {
      onlineCount.textContent = count;
    });
  
    function sendMessage() {
      const text = messageInput.value.trim();
      if (text) {
        const messageData = {
          user,
          text,
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
  
    function scrollToBottom() {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  });