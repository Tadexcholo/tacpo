const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const router = express.Router();


const storage = multer.diskStorage({
    destination: './public/imagenes/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });


router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM trabajos');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener los trabajos:", error);
        res.status(500).json({ error: 'Error al obtener los trabajos' });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM trabajos WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Trabajo no encontrado' });
        res.json(rows[0]);
    } catch (error) {
        console.error("Error al obtener el trabajo:", error);
        res.status(500).json({ error: 'Error al obtener el trabajo' });
    }
});


router.post('/', upload.single('imagen'), async (req, res) => {
    try {
        const { tipo, material, costo, tamano } = req.body;
        const imagen = req.file ? req.file.filename : null;

        if (!tipo || !material || !costo || !tamano) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        await db.query(
            'INSERT INTO trabajos (tipo, material, costo, tamano, imagen) VALUES (?, ?, ?, ?, ?)',
            [tipo, material, costo, tamano, imagen]
        );

        res.status(201).json({ message: 'Trabajo creado exitosamente' });
    } catch (error) {
        console.error("Error al crear el trabajo:", error);
        res.status(500).json({ error: 'Error al crear el trabajo' });
    }
});


router.put('/:id', upload.single('imagen'), async (req, res) => {
    try {
        const { tipo, material, costo, tamano } = req.body;
        const imagen = req.file ? req.file.filename : req.body.imagen_actual;

        const [result] = await db.query(
            'UPDATE trabajos SET tipo = ?, material = ?, costo = ?, tamano = ?, imagen = ? WHERE id = ?',
            [tipo, material, costo, tamano, imagen, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Trabajo no encontrado" });
        }

        res.json({ message: 'Trabajo actualizado correctamente' });
    } catch (error) {
        console.error("Error al actualizar el trabajo:", error);
        res.status(500).json({ error: 'Error al actualizar el trabajo' });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM trabajos WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Trabajo no encontrado" });
        }

        res.json({ message: 'Trabajo eliminado correctamente' });
    } catch (error) {
        console.error("Error al eliminar el trabajo:", error);
        res.status(500).json({ error: 'Error al eliminar el trabajo' });
    }
});

module.exports = router;
