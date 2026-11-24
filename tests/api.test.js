import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';

let db;
let server;
let baseUrl;
let token;

before(async () => {
    dotenv.config({
        path: fileURLToPath(new URL('../.env', import.meta.url))
    });

    const databaseName = process.env.DB_NAME || 'loja_bicicletas';
    const testDatabaseName = process.env.TEST_DB_NAME || 'loja_bicicletas_test';
    if (!/_test$/i.test(testDatabaseName) || testDatabaseName === databaseName) {
        throw new Error('TEST_DB_NAME deve ser um banco separado terminado em _test');
    }

    process.env.DB_NAME = testDatabaseName;
    process.env.JWT_SECRET = 'chave-secreta-exclusiva-dos-testes';

    const databaseModule = await import('../src/config/database.js');
    db = databaseModule.default;

    const [
        { default: Bicicleta },
        { default: Cliente },
        { default: Escolha },
        { default: routerB },
        { default: routerC },
        { default: routerE },
        { default: routerAuth }
    ] = await Promise.all([
        import('../src/model/bicicleta.js'),
        import('../src/model/cliente.js'),
        import('../src/model/escolha.js'),
        import('../src/routers/bicicletaRtr.js'),
        import('../src/routers/clienteRtr.js'),
        import('../src/routers/escolhaRtr.js'),
        import('../src/routers/authRtr.js')
    ]);

    Cliente.hasMany(Escolha, { foreignKey: 'clienteId' });
    Escolha.belongsTo(Cliente, { foreignKey: 'clienteId' });
    Bicicleta.hasMany(Escolha, { foreignKey: 'bicicletaId' });
    Escolha.belongsTo(Bicicleta, { foreignKey: 'bicicletaId' });

    await db.authenticate();
    await db.sync({ force: true });

    const app = express();
    app.use(express.json());
    app.use('/api/bicicletas', routerB);
    app.use('/api/clientes', routerC);
    app.use('/api/interessados', routerC);
    app.use('/api/escolhas', routerE);
    app.use('/api/auth', routerAuth);

    server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        listener.once('error', reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server) {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
    if (db) await db.close();
});

async function api(path, { method = 'GET', body, authorization } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (authorization) headers.Authorization = `Bearer ${authorization}`;

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const responseBody = response.status === 204
        ? null
        : await response.json();

    return { status: response.status, body: responseBody };
}

async function createBicycle(codigo, quadro) {
    const response = await api('/api/bicicletas/criar', {
        method: 'POST',
        body: { codigo, quadro, cor: 'azul' }
    });
    assert.equal(response.status, 201);
    return response.body;
}

async function createInterested(nome, altura) {
    const response = await api('/api/interessados/criar', {
        method: 'POST',
        body: {
            nome,
            telefone: '11999990000',
            email: `${nome.toLowerCase().replaceAll(' ', '.')}@example.com`,
            altura
        }
    });
    assert.equal(response.status, 201);
    return response.body;
}

test('API: autenticação, CRUD, filtros e regras das escolhas', async t => {
    await t.test('registra usuário, faz login e protege as rotas de escolhas', async () => {
        const registro = await api('/api/auth/registrar', {
            method: 'POST',
            body: { login: 'teste-api', senha: 'senha-de-teste-123' }
        });
        assert.equal(registro.status, 201);
        assert.equal(registro.body.login, 'teste-api');
        assert.equal('senha' in registro.body, false);

        const login = await api('/api/auth/login', {
            method: 'POST',
            body: { login: 'teste-api', senha: 'senha-de-teste-123' }
        });
        assert.equal(login.status, 200);
        assert.ok(login.body.token);
        token = login.body.token;

        const semToken = await api('/api/escolhas/buscar');
        assert.equal(semToken.status, 401);

        const comToken = await api('/api/escolhas/buscar', {
            authorization: token
        });
        assert.equal(comToken.status, 200);
    });

    await t.test('faz CRUD de bicicleta e filtra pelo quadro', async () => {
        const bicicleta = await createBicycle('CRUD-01', '14');

        const busca = await api('/api/bicicletas/quadro/14');
        assert.equal(busca.status, 200);
        assert.ok(busca.body.some(item => item.id === bicicleta.id));

        const alterada = await api(`/api/bicicletas/alterar/${bicicleta.id}`, {
            method: 'PUT',
            body: { cor: 'vermelha' }
        });
        assert.equal(alterada.status, 200);
        assert.equal(alterada.body.cor, 'vermelha');

        const encontrada = await api(`/api/bicicletas/buscarUm/${bicicleta.id}`);
        assert.equal(encontrada.status, 200);

        const removida = await api(`/api/bicicletas/deletar/${bicicleta.id}`, {
            method: 'DELETE'
        });
        assert.equal(removida.status, 204);
    });

    await t.test('faz CRUD de interessado', async () => {
        const interessado = await createInterested('Interessado CRUD', 1.65);

        const alterado = await api(`/api/interessados/alterar/${interessado.id}`, {
            method: 'PUT',
            body: { telefone: '11888887777' }
        });
        assert.equal(alterado.status, 200);
        assert.equal(alterado.body.telefone, '11888887777');

        const encontrado = await api(`/api/interessados/buscarUm/${interessado.id}`);
        assert.equal(encontrado.status, 200);

        const removido = await api(`/api/interessados/deletar/${interessado.id}`, {
            method: 'DELETE'
        });
        assert.equal(removido.status, 204);
    });

    await t.test('permite várias bicicletas compatíveis e consulta por interessado', async () => {
        const interessado = await createInterested('Ana Escolha', 1.50);
        const bicicletas = [
            await createBicycle('MULTI-14-A', '14'),
            await createBicycle('MULTI-14-B', '14')
        ];

        const escolha = await api('/api/escolhas/criar', {
            method: 'POST',
            authorization: token,
            body: {
                clienteId: interessado.id,
                bicicletaIds: bicicletas.map(item => item.id)
            }
        });

        assert.equal(escolha.status, 201);
        assert.equal(escolha.body.length, 2);
        assert.ok(escolha.body.every(item => item.dataEscolha));

        const consulta = await api(`/api/interessados/${interessado.id}/bicicletas`);
        assert.equal(consulta.status, 200);
        assert.equal(consulta.body.length, 2);
        assert.ok(consulta.body.every(item => item.bicicleta));
    });

    await t.test('aplica os limites de altura definidos para cada quadro', async () => {
        const casos = [
            { altura: 1.60, quadro: '16' },
            { altura: 1.70, quadro: '16' },
            { altura: 1.71, quadro: '17' }
        ];

        for (const [index, caso] of casos.entries()) {
            const interessado = await createInterested(`Limite ${index}`, caso.altura);
            const bicicleta = await createBicycle(`LIMITE-${index}`, caso.quadro);
            const escolha = await api('/api/escolhas/criar', {
                method: 'POST',
                authorization: token,
                body: {
                    clienteId: interessado.id,
                    bicicletaIds: [bicicleta.id]
                }
            });
            assert.equal(escolha.status, 201, `altura ${caso.altura} m`);
        }
    });

    await t.test('rejeita altura fora da faixa e quadro incompatível sem gravar escolhas', async () => {
        const baixa = await createInterested('Altura baixa', 1.49);
        const bicicleta14 = await createBicycle('INVALIDA-14', '14');
        const foraDaFaixa = await api('/api/escolhas/criar', {
            method: 'POST',
            authorization: token,
            body: { clienteId: baixa.id, bicicletaIds: [bicicleta14.id] }
        });
        assert.equal(foraDaFaixa.status, 400);

        const alta = await createInterested('Altura alta', 1.71);
        const bicicleta17 = await createBicycle('COMPATIVEL-17', '17');
        const antes = await api('/api/escolhas/buscar', { authorization: token });
        const incompatibilidade = await api('/api/escolhas/criar', {
            method: 'POST',
            authorization: token,
            body: {
                clienteId: alta.id,
                bicicletaIds: [bicicleta17.id, bicicleta14.id]
            }
        });
        assert.equal(incompatibilidade.status, 400);

        const depois = await api('/api/escolhas/buscar', { authorization: token });
        assert.equal(depois.body.length, antes.body.length);
    });

    await t.test('impede atualização para bicicleta incompatível e permite excluir escolha', async () => {
        const interessado = await createInterested('Atualizacao escolha', 1.71);
        const bicicleta17 = await createBicycle('UPDATE-17', '17');
        const bicicleta14 = await createBicycle('UPDATE-14', '14');
        const criada = await api('/api/escolhas/criar', {
            method: 'POST',
            authorization: token,
            body: { clienteId: interessado.id, bicicletaIds: [bicicleta17.id] }
        });
        assert.equal(criada.status, 201);

        const escolhaId = criada.body[0].id;
        const alteracaoIncompativel = await api(`/api/escolhas/alterar/${escolhaId}`, {
            method: 'PUT',
            authorization: token,
            body: { bicicletaId: bicicleta14.id }
        });
        assert.equal(alteracaoIncompativel.status, 400);

        const encontrada = await api(`/api/escolhas/buscarUm/${escolhaId}`, {
            authorization: token
        });
        assert.equal(encontrada.status, 200);
        assert.equal(encontrada.body.bicicletaId, bicicleta17.id);

        const removida = await api(`/api/escolhas/deletar/${escolhaId}`, {
            method: 'DELETE',
            authorization: token
        });
        assert.equal(removida.status, 204);
    });
});
