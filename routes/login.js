const express = require('express');
const router = express.Router();
const db = require('../config/db');  
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '../logs/access.log');
const TIEMPO_BLOQUEO = 30 * 1000; 

router.post('/login', async (req, res) => {
    try {
        const { nombre_usuario, contra } = req.body;

        if (!nombre_usuario || !contra) {
            return res.status(400).json({ msg: 'Faltan datos' });
        }

        
        const [results] = await db.query(
            'SELECT * FROM administradores WHERE nombre_usuario = ?',
            [nombre_usuario]
        );

        if (results.length === 0) {
            return res.status(401).json({ msg: 'Usuario no encontrado' });
        }

        const usuario = results[0];

        
        if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
            const tiempoRestante = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 1000);
            return res.status(403).json({ msg: `Cuenta bloqueada. Inténtalo en ${tiempoRestante} segundos.` });
        }

        
        const isMatch = await bcrypt.compare(contra, usuario.contra);
        if (!isMatch) {
            const intentosFallidos = usuario.intentos_fallidos + 1;

            if (intentosFallidos >= 3) {
                const bloqueoHasta = new Date(Date.now() + TIEMPO_BLOQUEO);
                await db.query(
                    'UPDATE administradores SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE nombre_usuario = ?',
                    [intentosFallidos, bloqueoHasta, nombre_usuario]
                );
                return res.status(403).json({ msg: `Demasiados intentos. Inténtalo en 30 segundos.` });
            } else {
                await db.query(
                    'UPDATE administradores SET intentos_fallidos = ? WHERE nombre_usuario = ?',
                    [intentosFallidos, nombre_usuario]
                );
                return res.status(401).json({ msg: 'Contraseña incorrecta' });
            }
        }

        
        await db.query(
            'UPDATE administradores SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE nombre_usuario = ?',
            [nombre_usuario]
        );

        // Generar token seguro
        const token = jwt.sign(
            { id: usuario.id, nombre_usuario },
            process.env.SECRET_KEY,
            { expiresIn: '1h' }
        );

        // Guardar en log de accesos
        const logMessage = `[${new Date().toISOString()}] Usuario "${nombre_usuario}" inició sesión\n`;
        fs.appendFileSync(LOG_PATH, logMessage, { encoding: 'utf8' });

        res.json({ msg: 'Login exitoso', token });
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
});

module.exports = router;
