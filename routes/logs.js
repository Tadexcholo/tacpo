const express = require('express');
const router = express.Router();
const db = require('../config/db');
const path = require('path');

// Ruta para ver los logs en formato JSON
router.get('/logs-http', async (req, res) => {
    try {
        const [logs] = await db.execute('SELECT * FROM logs_http ORDER BY fecha DESC');
        res.json(logs);
    } catch (error) {
        console.error('❌ Error obteniendo logs HTTP:', error);
        res.status(500).json({ msg: 'Error al obtener logs' });
    }
});

// Ruta para la vista de logs protegida
const authMiddleware = require('../middleware/auth');
router.get('/logs', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'logs.html'));
});

// Middleware para registrar logs HTTP
router.use(async (req, res, next) => {
    res.on('finish', async () => {
        const ip = req.ip || 'Desconocida';
        const metodo = req.method;
        const ruta = req.originalUrl;
        const codigo_estado = res.statusCode;
        const user_agent = req.get('User-Agent');
        try {
            await db.execute(
                'INSERT INTO logs_http (ip, metodo, ruta, codigo_estado, user_agent) VALUES (?, ?, ?, ?, ?)',
                [ip, metodo, ruta, codigo_estado, user_agent]
            );
        } catch (error) {
            console.error('Error al registrar log HTTP:', error);
        }
    });
    next();
});

module.exports = router;
