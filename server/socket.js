let ioInstance;
const rooms = {};

const initializeSocket = (io) => {
    ioInstance = io;
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('joinDrawing', ({ drawingId }) => {
            socket.join(drawingId);
            if (!rooms[drawingId]) {
                rooms[drawingId] = new Set();
            }
            rooms[drawingId].add(socket.id);
    
            io.to(drawingId).emit('updateClientCount', rooms[drawingId].size);
        });
    
        socket.on('sendDrawingData', ({ drawingId, data }) => {
            socket.to(drawingId).emit('receiveDrawingData', data);
        });
    
        socket.on('clearCanvas', (drawingId) => {
            socket.to(drawingId).emit('clearCanvas');
        });
    
        socket.on('disconnect', () => {
            for (const room of Object.keys(rooms)) {
                if (rooms[room].delete(socket.id)) {
                    io.to(room).emit('updateClientCount', rooms[room].size);
                }
            }
            console.log('Client disconnected');
        });
    });
};

module.exports = {
    initializeSocket,
    ioInstance,
};
