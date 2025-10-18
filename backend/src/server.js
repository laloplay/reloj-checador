const app = require('./app');
const sequelize = require('./db');
const http = require('http');
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set('socketio', io); 

io.on('connection', (socket) => {
  console.log('✅ Un administrador se ha conectado');
  socket.on('disconnect', () => {
    console.log('❌ Un administrador se ha desconectado');
  });
});

async function main() {
  try {
    await sequelize.sync({ force: false });
    console.log('Conexión a la base de datos establecida.');

    server.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
}

main();