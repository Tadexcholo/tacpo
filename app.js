require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const db = require('./config/db');
const path = require('path');
const axios = require('axios');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const multer = require('multer');
const i18n = require('i18n');
const verifyRecaptcha = require('./middleware/recaptcha');

const app = express();
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Configuración de multer para subir imágenes a la carpeta /public/imagenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/imagenes');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // Limita a 2MB por archivo
});

app.set('view engine', 'ejs');
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesión (se coloca antes de los breadcrumbs)
app.use(session({
  secret: process.env.SESSION_SECRET || 'clave-secreta',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));
// Ruta de inicio
app.use(express.static('public'));

i18n.configure({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  directory: __dirname + '/public/locales', // Corrige la ruta a los archivos
  cookie: 'lang', // Nombre de la cookie para almacenar el idioma
  objectNotation: true,
  queryParameter: 'lang' // Permite cambiar el idioma mediante ?lang=en en la URL
});

// Middleware para i18n
app.use(i18n.init);

// Middleware para detectar cambios de idioma
app.use((req, res, next) => {
  if (req.query.lang) {
    res.setLocale(req.query.lang);
    res.cookie('lang', req.query.lang, { maxAge: 900000, httpOnly: true });
  }
  next();
});
// Servir archivos públicos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Otras rutas...

const authMiddleware = require('./middleware/auth');
app.get('/dashboard.html', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/logs.html', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Servir archivos estáticos (HTML, CSS, JS) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));
const recuperarRouter = require('./routes/recuperar');
const contactoRoutes = require('./routes/contacto');
const registerRoutes = require('./routes/register');
const trabajosRoutes = require('./routes/trabajos');
const carritoRouter = require('./routes/carrito');

app.use('/api', require('./routes/login'));
app.use('/api/carrito', carritoRouter);
app.use('/api/register', registerRoutes); // Maneja la ruta /api/register
app.use('/api/trabajos', trabajosRoutes);
app.use('/api', require('./routes/logs'));    // Rutas de logs en su propio archivo
app.use('/api/enviar-correo', contactoRoutes);
app.use('/api/recuperar', recuperarRouter);
// Puerto de ejecución
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
