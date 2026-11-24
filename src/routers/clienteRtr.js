import express from 'express';
import { getClientes, getClienteById, createCliente, updateCliente, deleteCliente } from '../controller/clienteCtrl.js';

const routerC = express.Router();

routerC.get('/buscar', getClientes);
routerC.get('/buscarUm/:id', getClienteById);
routerC.get('/:id/bicicletas', getClienteById);
routerC.post('/criar', createCliente);
routerC.put('/alterar/:id', updateCliente);
routerC.delete('/deletar/:id', deleteCliente);

export default routerC;