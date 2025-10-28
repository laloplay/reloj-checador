const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Bono = sequelize.define('Bono', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  monto: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  tipo_condicion: {
    type: DataTypes.STRING, // Ej: 'PUNTUALIDAD', 'ASISTENCIA', 'NINGUNO'
    allowNull: true,
    defaultValue: 'NINGUNO'
  },
  valor_condicion: {
    type: DataTypes.INTEGER, // Ej: -10 (para 10 minutos antes), 100 (para 100% asistencia)
    allowNull: true,
    defaultValue: 0
  }
}, {
  timestamps: false
});

module.exports = Bono;