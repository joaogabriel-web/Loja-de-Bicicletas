import { Sequelize } from 'sequelize';
import db from '../config/database.js';

const cliente = db.define('clientes', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    telefone: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    altura: {
        type: Sequelize.DECIMAL,
        allowNull: false
    }
}, {
    timestamps: false,
    freezeTableName: true
})

export default cliente;