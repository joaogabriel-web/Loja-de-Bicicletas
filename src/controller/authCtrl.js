import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../model/usuario.js';

const segredo = process.env.JWT_SECRET || 'segredo-desenvolvimento';

export async function registrar(req, res) {
    try {
        const { login, senha, perfil } = req.body;

        if (!login || !senha) {
            return res.status(400).json({
                erro: 'Login e senha são obrigatórios'
            });
        }

        const usuarioExistente = await Usuario.findOne({
            where: { login }
        });

        if (usuarioExistente) {
            return res.status(409).json({
                erro: 'Login já cadastrado'
            });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const usuario = await Usuario.create({
            login,
            senha: senhaCriptografada,
            perfil: perfil || 'usuario'
        });

        return res.status(201).json({
            id: usuario.id,
            login: usuario.login,
            perfil: usuario.perfil
        });
    } catch (erro) {
        return res.status(500).json({
            erro: 'Erro ao registrar usuário'
        });
    }
}

export async function login(req, res) {
    try {
        const { login, senha } = req.body;

        const usuario = await Usuario.findOne({
            where: { login }
        });

        if (!usuario) {
            return res.status(401).json({
                erro: 'Login ou senha inválidos'
            });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({
                erro: 'Login ou senha inválidos'
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                login: usuario.login,
                perfil: usuario.perfil
            },
            segredo,
            {
                expiresIn: '1h'
            }
        );

        return res.json({
            mensagem: 'Login realizado com sucesso',
            token
        });
    } catch (erro) {
        return res.status(500).json({
            erro: 'Erro ao realizar login'
        });
    }
}