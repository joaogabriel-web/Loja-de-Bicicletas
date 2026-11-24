import express from 'express';
import { getEscolhas, getEscolhaById, createEscolha, updateEscolha, deleteEscolha } from '../controller/escolhaCtrl.js';
import { autenticar } from '../middleware/authMiddleware.js';

const routerE = express.Router();

routerE.get('/buscar', autenticar, getEscolhas);
routerE.get('/buscarUm/:id', autenticar, getEscolhaById);
routerE.post('/criar', autenticar, createEscolha);
routerE.put('/alterar/:id', autenticar, updateEscolha);
routerE.delete('/deletar/:id', autenticar, deleteEscolha);

export default routerE;