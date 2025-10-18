// backend/src/models/Bono.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Bono = sequelize.define('Bono', {
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true, // ✅ AÑADE ESTA LÍNEA
  },
  monto: { 
    type: DataTypes.FLOAT, 
    allowNull: false 
  },
});

module.exports = Bono;