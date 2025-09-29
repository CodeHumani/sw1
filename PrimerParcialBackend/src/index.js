import app from './config/app.js';
import pool from './config/db.js';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import errorHandler from './middlewares/catchedAsync.js';
import { updateSala, getSalaById } from './models/sala.model.js';

pool.connect()
    .then(() => console.log("✅ Conectado exitosamente a la base de datos"))
    .catch(err => console.error("❌ Error conectando a la base de datos", err.stack));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: 'http://localhost:5000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

app.set('io', io);
const salasActivas = new Map();

io.on('connection', (socket) => {
    console.log('🟢 Nuevo cliente conectado:', socket.id);
    socket.on('unirseSala', async ({ salaId, usuario }) => {
        try {
            const salaIdNormalizado = parseInt(salaId, 10);
            if (isNaN(salaIdNormalizado)) {
                console.error(`❌ salaId inválido recibido: ${salaId} (tipo: ${typeof salaId})`);
                socket.emit('errorSincronizacion', { message: 'ID de sala inválido' });
                return;
            }
            socket.join(`sala_${salaIdNormalizado}`);
            socket.salaId = salaIdNormalizado;
            socket.usuario = usuario;            
            // Usar salaId normalizado en todas las operaciones
            if (!salasActivas.has(salaIdNormalizado)) {
                salasActivas.set(salaIdNormalizado, {
                    usuarios: new Map(),
                    ultimoEstado: null,
                    ultimaModificacion: null
                });
            }
            const sala = salasActivas.get(salaIdNormalizado);
            sala.usuarios.set(socket.id, { ...usuario, socketId: socket.id });
            const clientesSocketIO = io.sockets.adapter.rooms.get(`sala_${salaIdNormalizado}`);
            console.log(`📍 ESTADO DE SALA ${salaIdNormalizado}:`);
            console.log(`   👥 Usuarios en memoria: ${sala.usuarios.size}`);
            console.log(`   🔌 Clientes Socket.IO: ${clientesSocketIO ? clientesSocketIO.size : 0}`);
            
            sala.usuarios.forEach((user, socketId) => {
                console.log(`      - ${user.name} (${user.isInvited ? 'INVITADO' : 'PROPIETARIO'}) - Socket: ${socketId}`);
            });
            
            socket.to(`sala_${salaIdNormalizado}`).emit('usuarioUnido', { 
                usuario: usuario,
                timestamp: Date.now()
            });
            
            try {
                console.log(`🔍 Socket: Cargando estado para sala ID: ${salaIdNormalizado}`);
                const salaData = await getSalaById(salaIdNormalizado);
                if (salaData && salaData.length > 0 && salaData[0].xml) {
                    const estadoInicial = JSON.parse(salaData[0].xml);
                    
                    // 🚀 ENVIAR TANTO estadoInicial COMO xmlActualizado para máxima compatibilidad
                    socket.emit('estadoInicial', { state: estadoInicial });
                    
                    // 🆕 TAMBIÉN enviar como xmlActualizado para activar la sincronización automática
                    socket.emit('xmlActualizado', {
                        nuevoEstado: estadoInicial,
                        message: 'Sincronizando con pizarra actual',
                        timestamp: new Date(),
                        source: 'initial_sync'
                    });
                    
                    sala.ultimoEstado = estadoInicial;
                    console.log(`✅ Socket: Estado cargado y sincronizado para sala ${salaIdNormalizado}`);
                } else {
                    console.log(`⚠️ Socket: No se encontró estado para sala ${salaIdNormalizado}`);
                    socket.emit('estadoInicial', { state: null });
                }
            } catch (error) {
                console.error(`❌ Socket: Error cargando estado para sala ${salaIdNormalizado}:`, error);
                socket.emit('estadoInicial', { state: null });
            }
            const usuariosConectados = Array.from(sala.usuarios.values());
            socket.emit('usuariosConectados', { usuarios: usuariosConectados });
            
            usuariosConectados.forEach(u => {
                console.log(`      - ${u.name} (${u.isInvited ? 'INVITADO/USERSALA' : 'PROPIETARIO'})`);
            });
        } catch (error) {
            console.error('Error al unirse a la sala:', error);
            socket.emit('errorSincronizacion', { message: 'Error al unirse a la sala' });
        }
    });

    socket.on('actualizarDiagrama', (data) => {
        try {
            const { salaId, usuario, action } = data;
            const salaIdNormalizado = parseInt(salaId, 10);
            const socketSalaNormalizada = parseInt(socket.salaId, 10);
            if (!socket.salaId || socketSalaNormalizada !== salaIdNormalizado) {
                console.log(`❌ Usuario NO conectado a sala ${salaIdNormalizado} (está en ${socketSalaNormalizada})`);
                socket.emit('errorSincronizacion', { message: 'No estás conectado a esta sala' });
                return;
            }
            const sala = salasActivas.get(salaIdNormalizado);
            if (sala) {
                sala.ultimaModificacion = Date.now();
                if (action === 'fullState') {
                    sala.ultimoEstado = data.data.state;
                }
                sala.usuarios.forEach((user, socketId) => {
                    console.log(`      - ${user.name} (${user.isInvited ? 'INVITADO/USERSALA' : 'PROPIETARIO/ANFITRIÓN'})`);
                });
            }
            const clientesEnSala = io.sockets.adapter.rooms.get(`sala_${salaIdNormalizado}`);
            const numClientesDestino = clientesEnSala ? clientesEnSala.size - 1 : 0;
            socket.to(`sala_${salaIdNormalizado}`).emit('diagramaActualizado', data);
            
        } catch (error) {
            console.error('❌ Error actualizando diagrama:', error);
            socket.emit('errorSincronizacion', { message: 'Error al sincronizar cambios' });
        }
    });

    socket.on('guardarEstado', async ({ salaId, estado }) => {
        try {
            console.log(`💾 Socket: Guardando estado de sala ${salaId} en base de datos`);
            const estadoJson = JSON.stringify(estado);
            await updateSala(salaId, undefined, estadoJson, undefined, io);
            const sala = salasActivas.get(salaId);
            if (sala) {
                sala.ultimoEstado = estado;
            }
            socket.emit('estadoGuardado', { success: true });
            console.log(`✅ Socket: Estado guardado exitosamente para sala ${salaId}`);
        } catch (error) {
            console.error(`❌ Socket: Error guardando estado para sala ${salaId}:`, error);
            socket.emit('errorSincronizacion', { message: 'Error al guardar en la base de datos' });
        }
    });

    socket.on('solicitarEstado', async ({ salaId }) => {
        try {
            console.log(`📥 Solicitando estado inicial para sala ${salaId}`);
            const sala = salasActivas.get(salaId);
            if (sala && sala.ultimoEstado) {
                socket.emit('estadoInicial', { state: sala.ultimoEstado });
                return;
            }
            console.log(`🔍 Socket: Cargando estado para sala ${salaId} desde DB`);
            const salaData = await getSalaById(salaId);
            if (salaData && salaData.length > 0 && salaData[0].xml) {
                const estadoInicial = JSON.parse(salaData[0].xml);
                socket.emit('estadoInicial', { state: estadoInicial });
                if (sala) {
                    sala.ultimoEstado = estadoInicial;
                }
                console.log(`✅ Socket: Estado cargado desde DB para sala ${salaId}`);
            } else {
                console.log(`⚠️ Socket: No se encontró estado en DB para sala ${salaId}`);
                socket.emit('estadoInicial', { state: null });
            }
        } catch (error) {
            console.error('Error cargando estado inicial:', error);
            socket.emit('errorSincronizacion', { message: 'Error al cargar estado inicial' });
        }
    });

    socket.on('disconnect', () => {
        try {
            console.log('🔴 Cliente desconectado:', socket.id);
            if (socket.salaId && socket.usuario) {
                const sala = salasActivas.get(socket.salaId);
                if (sala) {
                    sala.usuarios.delete(socket.id);
                    socket.to(`sala_${socket.salaId}`).emit('usuarioSalio', { 
                        usuarioId: socket.usuario.id 
                    });
                    if (sala.usuarios.size === 0) {
                        console.log(`🗑️ Limpiando sala vacía ${socket.salaId}`);
                        salasActivas.delete(socket.salaId);
                    }
                }
            }
        } catch (error) {
            console.error('Error en desconexión:', error);
        }
    });
});

// REMOVIDO: Auto-guardado por intervalo de tiempo
// Ahora solo se guarda cuando hay eventos reales de usuario (movimientos, cambios)
console.log('� Auto-guardado por tiempo DESHABILITADO - Solo guardado por eventos de usuario');

app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});
app.use(errorHandler);

const PORT = 8083;
server.listen(PORT, () => {
    console.log(`🚀 Servidor Express + Socket.IO corriendo en puerto ${PORT}`);
    console.log(`🔄 Sistema de colaboración en tiempo real activado`);
    console.log(`💾 Auto-guardado configurado cada 30 segundos`);
});
