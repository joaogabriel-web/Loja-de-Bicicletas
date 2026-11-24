import express from "express";
import db from "./config/database.js";
import Bicicleta from "./model/bicicleta.js";
import Cliente from "./model/cliente.js";
import Escolha from "./model/escolha.js";
import Usuario from "./model/usuario.js";
import routerB from "./routers/bicicletaRtr.js";
import routerC from "./routers/clienteRtr.js";
import routerE from "./routers/escolhaRtr.js";
import routerAuth from './routers/authRtr.js';

const app = express();
app.use(express.json())

app.use("/api/bicicletas", routerB)
app.use("/api/clientes", routerC)
app.use("/api/interessados", routerC)
app.use("/api/escolhas", routerE)
app.use("/api/auth", routerAuth)

Cliente.hasMany(Escolha, { foreignKey: "clienteId" });
Escolha.belongsTo(Cliente, { foreignKey: "clienteId" });
Bicicleta.hasMany(Escolha, { foreignKey: "bicicletaId" });
Escolha.belongsTo(Bicicleta, { foreignKey: "bicicletaId" });

try {
    await db.authenticate();
    await db.sync({ alter: true });
    app.listen(3000, () => {
        console.log("Servidor rodando na porta 3000");
    });
} catch (erro) {
    console.error("Não foi possível conectar ao banco de dados:", erro.message);
    process.exitCode = 1;
}

export default app;