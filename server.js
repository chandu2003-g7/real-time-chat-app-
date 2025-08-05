const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users = new Map();

// Handle socket connections
io.on('connection', (socket) => {
    console.log('🎉 Someone joined the chat!', socket.id);

    // Handle user joining
    socket.on('user-joined', (username) => {
        console.log(`👋 ${username} joined the chat`);
        users.set(socket.id, username);
        socket.broadcast.emit('user-connected', username);
        
        const usersList = Array.from(users.values());
        socket.emit('users-list', usersList);
        io.emit('update-users', usersList);
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
        console.log(`💬 ${users.get(socket.id)} says: ${data.message}`);
        socket.broadcast.emit('chat-message', {
            username: users.get(socket.id),
            message: data.message,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
        socket.broadcast.emit('user-typing', {
            username: users.get(socket.id),
            isTyping: data.isTyping
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            console.log(`👋 ${username} left the chat`);
            users.delete(socket.id);
            socket.broadcast.emit('user-disconnected', username);
            
            const usersList = Array.from(users.values());
            io.emit('update-users', usersList);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Chat app is running!`);
    console.log(`📱 Open your browser and go to: http://localhost:${PORT}`);
    console.log(`🛑 To stop the server, press Ctrl+C`);
});
