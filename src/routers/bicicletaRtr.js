import express from 'express';
import { getBicicletas, getBicicletaById, createBicicleta, updateBicicleta, deleteBicicleta } from '../controller/bicicletaCtrl.js';

const routerB = express.Router();

routerB.get('/buscar', getBicicletas);
routerB.get('/buscarUm/:id', getBicicletaById);
routerB.get('/quadro/:quadro', getBicicletas);
routerB.post('/criar', createBicicleta);
routerB.put('/alterar/:id', updateBicicleta);
routerB.delete('/deletar/:id', deleteBicicleta);

export default routerB;