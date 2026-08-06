require('dotenv').config();

const express = require('express');
const path = require('path');
const connectDB = require('./config/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware CORS pour le frontend Angular
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ') || err.message;
    return res.status(400).json({ success: false, message });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'champ';
    return res.status(400).json({
      success: false,
      message: `Valeur déjà utilisée pour : ${field}`
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Identifiant invalide : ${err.path || 'id'}`
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Erreur interne du serveur'
  });
});

const start = async () => {
  await connectDB();
  try {
    const OrderService = require('./services/orderService');
    await OrderService.migrateStatusesToTwoStates();
  } catch (err) {
    console.warn('Migration des statuts commandes:', err.message);
  }
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
};

start();
