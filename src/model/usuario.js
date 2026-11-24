import { Sequelize } from 'sequelize';
import db from '../config/database.js';

const Usuario = db.define('usuarios', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    login: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    senha: {
        type: Sequelize.STRING,
        allowNull: false
    },
    perfil: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'usuario'
    }
}, {
    timestamps: false,
    freezeTableName: true
});

export default Usuario;
