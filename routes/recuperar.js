// routes/recuperar.js
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const twilio = require('twilio');
const crypto = require('crypto');

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Endpoint para enviar el código de recuperación por SMS
router.post('/send-code', [
    check('correo').isEmail().withMessage('Correo inválido')
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ msg: errors.array() });
    }
    const { correo } = req.body;
    try {
        // Verificar si el usuario existe en la base de datos
        const [userResult] = await db.query('SELECT * FROM administradores WHERE correo = ?', [correo]);
        if(userResult.length === 0){
            return res.status(400).json({ msg: 'El correo no está registrado' });
        }
        const user = userResult[0];
        // Generar un nuevo código de verificación y actualizarlo en la DB
        const codigoConfirmacion = crypto.randomInt(100000, 999999);
        await db.query('UPDATE administradores SET codigo_confirmacion = ? WHERE correo = ?', [codigoConfirmacion, correo]);
        // Enviar SMS con el código al número registrado del usuario
        try {
            const message = await twilioClient.messages.create({
                body: `Tu código de recuperación es: ${codigoConfirmacion}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: user.numero
            });
            console.log('SMS enviado:', message.sid);
        } catch (smsError) {
            console.error('Error al enviar SMS:', smsError);
            return res.status(500).json({ msg: 'Error al enviar SMS de verificación' });
        }
        res.status(200).json({ msg: 'Código de verificación enviado por SMS.' });
    } catch (error) {
        console.error('Error en enviar código de recuperación:', error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
});

// Endpoint para verificar el código y actualizar la contraseña
router.post('/verify', [
    check('correo').isEmail().withMessage('Correo inválido'),
    check('codigo_confirmacion').not().isEmpty().withMessage('El código es obligatorio'),
    check('nueva_contra').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ msg: errors.array() });
    }
    const { correo, codigo_confirmacion, nueva_contra } = req.body;
    try {
        // Buscar usuario por correo
        const [userResult] = await db.query('SELECT * FROM administradores WHERE correo = ?', [correo]);
        if(userResult.length === 0){
            return res.status(400).json({ msg: 'El correo no está registrado' });
        }
        const user = userResult[0];
        // Verificar el código de recuperación
        if(user.codigo_confirmacion != codigo_confirmacion){
            return res.status(400).json({ msg: 'Código de verificación incorrecto' });
        }
        // Hashear la nueva contraseña
        const hashedPassword = await bcrypt.hash(nueva_contra, 10);
        // Actualizar la contraseña en la base de datos
        await db.query('UPDATE administradores SET contra = ? WHERE correo = ?', [hashedPassword, correo]);
        res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });
    } catch (error) {
        console.error('Error en la verificación y actualización de contraseña:', error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
});

module.exports = router;
