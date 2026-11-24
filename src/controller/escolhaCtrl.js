import Bicicleta from '../model/bicicleta.js';
import Cliente from '../model/cliente.js';
import Escolha from '../model/escolha.js';
import db from '../config/database.js';

function quadroPorAltura(altura) {
    if (altura > 1.70) return '17';
    if (altura >= 1.60) return '16';
    if (altura >= 1.50) return '14';
    return null;
}

export async function getEscolhas(req, res) {
    try {
        return res.json(await Escolha.findAll({
            include: [Cliente, Bicicleta]
        }));
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao listar escolhas' });
    }
}

export async function getEscolhaById(req, res) {
    try {
        const escolha = await Escolha.findByPk(req.params.id, {
            include: [Cliente, Bicicleta]
        });
        if (!escolha) return res.status(404).json({ erro: 'Escolha não encontrada' });
        return res.json(escolha);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao buscar escolha' });
    }
}

export async function createEscolha(req, res) {
    try {
        const { clienteId, bicicletaIds } = req.body;
        if (!clienteId || !Array.isArray(bicicletaIds) || bicicletaIds.length === 0) {
            return res.status(400).json({ erro: 'clienteId e bicicletaIds são obrigatórios' });
        }

        const cliente = await Cliente.findByPk(clienteId);
        if (!cliente) return res.status(404).json({ erro: 'Interessado não encontrado' });

        const quadro = quadroPorAltura(Number(cliente.altura));
        if (!quadro) {
            return res.status(400).json({ erro: 'Altura fora da faixa de recomendação' });
        }

        const bicicletas = await Bicicleta.findAll({
            where: { id: bicicletaIds }
        });

        if (bicicletas.length !== new Set(bicicletaIds).size) {
            return res.status(404).json({ erro: 'Uma ou mais bicicletas não foram encontradas' });
        }

        const incompativel = bicicletas.find(bicicleta => bicicleta.quadro !== quadro);
        if (incompativel) {
            return res.status(400).json({
                erro: `Para altura ${cliente.altura} m, o quadro deve ser ${quadro}`
            });
        }

        const registros = await db.transaction(async transaction =>
            Promise.all(bicicletas.map(bicicleta =>
                Escolha.create({
                    dataEscolha: new Date(),
                    clienteId,
                    bicicletaId: bicicleta.id
                }, { transaction })
            ))
        );

        return res.status(201).json(registros);
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }
}

export async function updateEscolha(req, res) {
    try {
        const escolha = await Escolha.findByPk(req.params.id);
        if (!escolha) return res.status(404).json({ erro: 'Escolha não encontrada' });

        const clienteId = req.body.clienteId !== undefined
            ? req.body.clienteId
            : escolha.clienteId;
        const bicicletaId = req.body.bicicletaId !== undefined
            ? req.body.bicicletaId
            : escolha.bicicletaId;

        const cliente = await Cliente.findByPk(clienteId);
        if (!cliente) return res.status(404).json({ erro: 'Interessado não encontrado' });

        const bicicleta = await Bicicleta.findByPk(bicicletaId);
        if (!bicicleta) return res.status(404).json({ erro: 'Bicicleta não encontrada' });

        const quadro = quadroPorAltura(Number(cliente.altura));
        if (!quadro) {
            return res.status(400).json({ erro: 'Altura fora da faixa de recomendação' });
        }
        if (bicicleta.quadro !== quadro) {
            return res.status(400).json({
                erro: `Para altura ${cliente.altura} m, o quadro deve ser ${quadro}`
            });
        }

        const atualizacoes = {};
        if (req.body.clienteId !== undefined) atualizacoes.clienteId = clienteId;
        if (req.body.bicicletaId !== undefined) atualizacoes.bicicletaId = bicicletaId;
        if (req.body.dataEscolha !== undefined) atualizacoes.dataEscolha = req.body.dataEscolha;

        await escolha.update(atualizacoes);
        return res.json(escolha);
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }
}

export async function deleteEscolha(req, res) {
    try {
        const escolha = await Escolha.findByPk(req.params.id);
        if (!escolha) return res.status(404).json({ erro: 'Escolha não encontrada' });
        await escolha.destroy();
        return res.status(204).send();
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao excluir escolha' });
    }
}