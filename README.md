# Loja de Bicicletas API

API REST para cadastro de bicicletas e interessados e registro de escolhas com
recomendação de quadro baseada na altura. A aplicação usa Node.js, Express,
Sequelize e MySQL.

## Requisitos

- Node.js 18 ou superior
- MySQL instalado e em execução
- Um banco para a aplicação e outro banco exclusivo para os testes

## Configuração inicial

Na raiz do projeto, crie o arquivo `.env` copiando `.env.example` e informe os
dados de conexão do MySQL. Exemplo:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=loja_bicicletas
DB_USER=root
DB_PASSWORD=sua_senha
JWT_SECRET=troque-por-uma-chave-longa-e-aleatoria
```

Crie os bancos `loja_bicicletas` e `loja_bicicletas_test` no MySQL. No
MySQL Workbench ou em outro cliente conectado ao servidor, execute cada comando:

```sql
CREATE DATABASE loja_bicicletas;
```

```sql
CREATE DATABASE loja_bicicletas_test;
```

O usuário configurado em `DB_USER` precisa ter permissão para criar e alterar
tabelas nos dois bancos. **A suíte recria as tabelas do banco de teste a cada
execução (`sync({ force: true })`); nunca configure `TEST_DB_NAME` com o banco
que contém seus dados reais.**

Instale as dependências e inicie a API:

```powershell
npm install
npm run dev
```

O servidor fica disponível em `http://localhost:3000`. As tabelas são criadas
automaticamente ao iniciar, via Sequelize.

## Executar os testes automatizados

Com o MySQL em execução e o banco `loja_bicicletas_test` criado:

```powershell
npm test
```

Os testes sobem a API em uma porta local temporária, usam o banco de teste
configurado em `TEST_DB_NAME` (padrão `loja_bicicletas_test`) e fecham a conexão
ao terminar. Para escolher outro banco isolado, defina `TEST_DB_NAME` com um
nome terminado em `_test` antes do comando:

```powershell
$env:TEST_DB_NAME = "minha_loja_test"
npm test
```

A suíte verifica login e proteção JWT, CRUD de bicicletas e interessados,
consulta de bicicletas por quadro e por interessado, escolhas múltiplas,
limites de altura, rejeição de quadros incompatíveis e atualização/exclusão
de escolhas.

## Demonstração manual da API

Mantenha `npm run dev` aberto em um terminal e execute os exemplos abaixo em
outro PowerShell. Eles usam `Invoke-RestMethod`, que já vem com o Windows.

### 1. Criar uma conta e obter o token

```powershell
$base = "http://localhost:3000"
$usuario = @{ login = "apresentacao"; senha = "senha12345" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/auth/registrar" `
  -ContentType "application/json" -Body $usuario

$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" `
  -ContentType "application/json" -Body $usuario
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }
```

O cadastro retorna o usuário sem expor a senha. O login retorna um token JWT
válido por uma hora. Para os endpoints protegidos, envie
`Authorization: Bearer <token>`.

### 2. Cadastrar bicicletas e um interessado

```powershell
$bikeA = @{ codigo = "B-14-A"; quadro = "14"; cor = "azul" } | ConvertTo-Json
$bikeB = @{ codigo = "B-14-B"; quadro = "14"; cor = "vermelha" } | ConvertTo-Json
$b1 = Invoke-RestMethod -Method Post -Uri "$base/api/bicicletas/criar" `
  -ContentType "application/json" -Body $bikeA
$b2 = Invoke-RestMethod -Method Post -Uri "$base/api/bicicletas/criar" `
  -ContentType "application/json" -Body $bikeB

$pessoa = @{
  nome = "Ana da Silva"
  telefone = "11999990000"
  email = "ana@example.com"
  altura = 1.55
} | ConvertTo-Json
$interessado = Invoke-RestMethod -Method Post -Uri "$base/api/interessados/criar" `
  -ContentType "application/json" -Body $pessoa
```

### 3. Registrar duas escolhas e consultar o resultado

Para a altura de 1,55 m, a regra exige quadro 14. A rota de escolhas exige o
token obtido no login:

```powershell
$selecao = @{
  clienteId = $interessado.id
  bicicletaIds = @($b1.id, $b2.id)
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/escolhas/criar" `
  -Headers $headers -ContentType "application/json" -Body $selecao

Invoke-RestMethod -Method Get `
  -Uri "$base/api/interessados/$($interessado.id)/bicicletas"
```

A API deve responder com dois registros, cada um com a data da escolha, e a
consulta do interessado deve listar as bicicletas selecionadas.

### 4. Demonstrar consultas e validação

```powershell
# Filtrar bicicletas pelo quadro
Invoke-RestMethod -Method Get -Uri "$base/api/bicicletas/quadro/14"

# Listar escolhas; requer o token
Invoke-RestMethod -Method Get -Uri "$base/api/escolhas/buscar" -Headers $headers

# Exemplo inválido: interessado com 1,55 m tentando escolher quadro 17
$bikeErrada = @{ codigo = "B-17"; quadro = "17"; cor = "preta" } | ConvertTo-Json
$b3 = Invoke-RestMethod -Method Post -Uri "$base/api/bicicletas/criar" `
  -ContentType "application/json" -Body $bikeErrada
$selecaoErrada = @{
  clienteId = $interessado.id
  bicicletaIds = @($b3.id)
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/escolhas/criar" `
  -Headers $headers -ContentType "application/json" -Body $selecaoErrada
```

Na última chamada, a API deve retornar erro HTTP 400 porque o quadro não
corresponde à altura. Para testar os limites, cadastre interessados de 1,60 m,
1,70 m e acima de 1,70 m: os dois primeiros usam quadro 16 e o último, quadro
17. Alturas abaixo de 1,50 m são recusadas.

## Rotas disponíveis

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/registrar` | Público | Cadastrar usuário |
| `POST` | `/api/auth/login` | Público | Fazer login e obter JWT |
| `GET` | `/api/bicicletas/buscar` | Público | Listar bicicletas |
| `GET` | `/api/bicicletas/buscarUm/:id` | Público | Buscar bicicleta por ID |
| `GET` | `/api/bicicletas/quadro/:quadro` | Público | Filtrar pelo quadro |
| `POST` | `/api/bicicletas/criar` | Público | Cadastrar bicicleta |
| `PUT` | `/api/bicicletas/alterar/:id` | Público | Atualizar bicicleta |
| `DELETE` | `/api/bicicletas/deletar/:id` | Público | Excluir bicicleta |
| `GET` | `/api/interessados/buscar` | Público | Listar interessados |
| `GET` | `/api/interessados/buscarUm/:id` | Público | Buscar interessado |
| `GET` | `/api/interessados/:id/bicicletas` | Público | Consultar escolhas do interessado |
| `POST` | `/api/interessados/criar` | Público | Cadastrar interessado |
| `PUT` | `/api/interessados/alterar/:id` | Público | Atualizar interessado |
| `DELETE` | `/api/interessados/deletar/:id` | Público | Excluir interessado |
| `GET` | `/api/escolhas/buscar` | JWT | Listar escolhas |
| `GET` | `/api/escolhas/buscarUm/:id` | JWT | Buscar escolha |
| `POST` | `/api/escolhas/criar` | JWT | Registrar uma ou mais bicicletas |
| `PUT` | `/api/escolhas/alterar/:id` | JWT | Atualizar escolha |
| `DELETE` | `/api/escolhas/deletar/:id` | JWT | Excluir escolha |

O corpo de cadastro de bicicleta usa `codigo`, `quadro` e `cor`; o de
interessado usa `nome`, `telefone`, `email` e `altura`. Para criar escolhas,
envie `clienteId` e uma lista não vazia `bicicletaIds`. A data é gerada
automaticamente.
