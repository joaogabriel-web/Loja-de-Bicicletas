import Cliente from '../model/cliente.js';
import Escolha from '../model/escolha.js';
import Bicicleta from '../model/bicicleta.js';

export async function getClientes(req, res) {
    try {
        return res.json(await Cliente.findAll());
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao listar interessados' });
    }
}

export async function getClienteById(req, res) {
    try {
        const cliente = await Cliente.findByPk(req.params.id);
        if (!cliente) return res.status(404).json({ erro: 'Interessado não encontrado' });

        if (req.path.endsWith('/bicicletas')) {
            const escolhas = await Escolha.findAll({
                where: { clienteId: cliente.id },
                include: [Bicicleta]
            });
            return res.json(escolhas);
        }

        return res.json(cliente);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao buscar interessado' });
    }
}

export async function createCliente(req, res) {
    try {
        const cliente = await Cliente.create(req.body);
        return res.status(201).json(cliente);
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }
}

export async function updateCliente(req, res) {
    try {
        const cliente = await Cliente.findByPk(req.params.id);
        if (!cliente) return res.status(404).json({ erro: 'Interessado não encontrado' });
        await cliente.update(req.body);
        return res.json(cliente);
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }
}

export async function deleteCliente(req, res) {
    try {
        const cliente = await Cliente.findByPk(req.params.id);
        if (!cliente) return res.status(404).json({ erro: 'Interessado não encontrado' });
        await cliente.destroy();
        return res.status(204).send();
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao excluir interessado' });
    }
}