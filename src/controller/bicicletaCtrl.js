import Bicicleta from '../model/bicicleta.js';

export async function getBicicletas(req, res) {
    try {
        const quadro = req.params.quadro || req.query.quadro;
        const bicicletas = quadro
            ? await Bicicleta.findAll({ where: { quadro } })
            : await Bicicleta.findAll();
        return res.json(bicicletas);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao listar bicicletas' });
    }
}

export async function getBicicletaById(req, res) {
    try {
        const bicicleta = await Bicicleta.findByPk(req.params.id);
        if (!bicicleta) return res.status(404).json({ erro: 'Bicicleta não encontrada' });
        return res.json(bicicleta);
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao buscar bicicleta' });
    }
}

export async function createBicicleta(req, res) {
    try {
        const bicicleta = await Bicicleta.create(req.body);
        return res.status(201).json(bicicleta);
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }
}

export async function updateBicicleta(req, res) {
    try {
        const bicicleta = await Bicicleta.findByPk(req.params.id);
        if (!bicicleta) return res.status(404).json({ erro: 'Bicicleta não encontrada' });
        await bicicleta.update(req.body);
        return res.json(bicicleta);
    } catch (erro) {
        return res.status(400).json({ erro: erro.message });
    }
}

export async function deleteBicicleta(req, res) {
    try {
        const bicicleta = await Bicicleta.findByPk(req.params.id);
        if (!bicicleta) return res.status(404).json({ erro: 'Bicicleta não encontrada' });
        await bicicleta.destroy();
        return res.status(204).send();
    } catch (erro) {
        return res.status(500).json({ erro: 'Erro ao excluir bicicleta' });
    }
}