import jwt from 'jsonwebtoken';

const segredo = process.env.JWT_SECRET || 'segredo-desenvolvimento';

export function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization;

    if (!cabecalho || !cabecalho.startsWith('Bearer ')) {
        return res.status(401).json({
            erro: 'Token não informado'
        });
    }

    const token = cabecalho.substring(7);

    try {
        const usuario = jwt.verify(token, segredo);

        req.usuario = usuario;
        next();
    } catch (erro) {
        return res.status(401).json({
            erro: 'Token inválido ou expirado'
        });
    }
}