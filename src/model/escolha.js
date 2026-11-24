import { Sequelize } from 'sequelize';
import db from '../config/database.js';


const Escolha = db.define('escolhas', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    dataEscolha: {
        type: Sequelize.DATE,
        allowNull: false
    },
    clienteId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    bicicletaId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false,
    freezeTableName: true
})

export default Escolha;