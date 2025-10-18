// backend/src/models/Empleado.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Empleado = sequelize.define('Empleado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sucursal: {
    type: DataTypes.STRING,
  },
  puesto: {
    type: DataTypes.STRING,
  },
  salario: {
    type: DataTypes.FLOAT, // Usamos FLOAT para valores monetarios
  },
  bono: {
    type: DataTypes.FLOAT,
  },
  fechaIngreso: {
    type: DataTypes.DATEONLY, // Solo la fecha, sin la hora
  },
  horaEntrada: {
    type: DataTypes.TIME, // Solo la hora
  },
  horaSalida: {
    type: DataTypes.TIME,
  }
});

module.exports = Empleado;