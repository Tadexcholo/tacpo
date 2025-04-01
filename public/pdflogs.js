const express = require('express');
const mysql = require('mysql2');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const port = 3000;

// Configurar la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'veterinaria'
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

app.get('/descargar-pdf', (req, res) => {
    const doc = new PDFDocument();
    const filename = 'logs_http.pdf';
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(14).text('Logs HTTP del Servidor', { align: 'center' });
    doc.moveDown();

    // Obtener los logs desde la base de datos
    db.query('SELECT * FROM logs_http', (err, results) => {
        if (err) {
            console.error('Error al obtener los logs:', err);
            res.status(500).send('Error al generar el PDF');
            return;
        }

        results.forEach(log => {
            doc.fontSize(10).text(`ID: ${log.id}, IP: ${log.ip}, Método: ${log.metodo}, Ruta: ${log.ruta}, Código: ${log.codigo_estado}, User-Agent: ${log.user_agent}, Fecha: ${log.fecha}`);
            doc.moveDown();
        });

        doc.end();
    });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});