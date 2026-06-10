# AMPARO — Guia de Execução no Windows

Este guia cobre como executar, desenvolver e manter o sistema AMPARO em
**Windows 10 e Windows 11** usando o **Visual Studio Code**, sem dependência
do Replit ou Linux.

---

## Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação Rápida](#instalação-rápida)
- [Opção A — Com Docker Desktop (Recomendado)](#opção-a--com-docker-desktop-recomendado)
- [Opção B — Execução Manual (sem Docker)](#opção-b--execução-manual-sem-docker)
- [Usando o VS Code](#usando-o-vs-code)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Backup e Restauração](#backup-e-restauração)
- [Publicação no GitHub](#publicação-no-github)
- [Solução de Problemas](#solução-de-problemas)
- [Checklist Final](#checklist-final)

---

## Pré-requisitos

Instale os seguintes programas antes de começar:

| Programa | Versão mínima | Download |
|----------|--------------|----------|
| **Node.js** | 20 LTS (recomendado: 24 LTS) | https://nodejs.org |
| **Git** | qualquer | https://git-scm.com |
| **VS Code** | qualquer | https://code.visualstudio.com |
| **Docker Desktop** | qualquer | https://www.docker.com/products/docker-desktop/ *(opcional, mas recomendado)* |

> **Dica:** No instalador do Node.js para Windows, marque a opção "Automatically install the necessary tools" para instalar ferramentas nativas (Build Tools).

---

## Instalação Rápida

### 1. Clonar o repositório

Abra o **Git Bash**, **PowerShell** ou o **Terminal do VS Code** e execute:

```powershell
git clone https://github.com/<seu-usuario>/amparo.git
cd amparo
```

### 2. Rodar o script de setup

```powershell
# Opção 1: Duplo clique no arquivo
scripts\setup.bat

# Opção 2: PowerShell diretamente
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

O script irá:
- Verificar Node.js e pnpm
- Instalar todas as dependências (`pnpm install`)
- Criar o arquivo `.env` a partir do `.env.example`

### 3. Abrir no VS Code

```powershell
code .
```

Quando o VS Code abrir, ele vai sugerir instalar as extensões recomendadas. **Aceite todas.**

---

## Opção A — Com Docker Desktop (Recomendado)

Esta é a forma mais simples: não precisa instalar PostgreSQL separadamente.

### 1. Configurar variáveis de ambiente

Edite o arquivo `.env` (criado pelo setup):

```env
POSTGRES_PASSWORD=minha_senha_segura
SESSION_SECRET=uma_chave_longa_e_aleatoria_aqui
```

### 2. Subir todos os serviços

```powershell
docker compose up -d
```

Isso vai iniciar automaticamente:
- 🐘 PostgreSQL 16 (com schema + usuários demo)
- ⚡ API Express
- 🌐 Frontend React (Nginx)

### 3. Acessar o sistema

Abra o navegador em: **http://localhost**

### Usuários de demonstração

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Gestor | admin@amparo.com | 123456 |
| Enfermeiro | enfermeiro@amparo.com | 123456 |
| Cuidador | cuidador@amparo.com | 123456 |

### Parar os serviços

```powershell
docker compose stop       # pausa (mantém dados)
docker compose down       # remove containers (mantém volume do banco)
docker compose down -v    # ⚠️ remove TUDO incluindo dados
```

---

## Opção B — Execução Manual (sem Docker)

Use esta opção se preferir não usar Docker ou quiser desenvolver com hot-reload.

### 1. Instalar e configurar o PostgreSQL

1. Baixe o instalador em https://www.postgresql.org/download/windows/
2. Durante a instalação, defina a senha do usuário `postgres`
3. Após instalar, abra o **pgAdmin** (instala junto) ou o **psql** e execute:

```sql
CREATE DATABASE amparo;
CREATE USER amparo WITH PASSWORD 'amparo_secret';
GRANT ALL PRIVILEGES ON DATABASE amparo TO amparo;
```

4. Aplique o schema inicial:

```powershell
# No PowerShell (psql precisa estar no PATH)
psql -U amparo -d amparo -f docker\init.sql
```

> **Dica:** Durante a instalação do PostgreSQL, marque "Add PostgreSQL bin directory to PATH" para que `psql` fique disponível no terminal.

### 2. Configurar o .env

Edite o arquivo `.env`:

```env
DATABASE_URL=postgresql://amparo:amparo_secret@localhost:5432/amparo
SESSION_SECRET=qualquer_string_longa_aqui
PORT=8080
NODE_ENV=development
```

### 3. Iniciar os servidores

**Via VS Code (recomendado):**

Pressione `Ctrl+Shift+P` → "Tasks: Run Task" → **"AMPARO: Iniciar Tudo"**

Isso abre dois terminais no VS Code: um para a API e outro para o frontend.

**Via terminal manualmente:**

Abra **dois terminais PowerShell** separados:

```powershell
# Terminal 1 — API Server (porta 8080)
$env:PORT = "8080"
$env:DATABASE_URL = "postgresql://amparo:amparo_secret@localhost:5432/amparo"
$env:SESSION_SECRET = "qualquer_string_longa"
pnpm --filter @workspace/api-server run dev
```

```powershell
# Terminal 2 — Frontend (porta 3000)
$env:PORT = "3000"
$env:BASE_PATH = "/"
pnpm --filter @workspace/amparo run dev
```

Acesse: **http://localhost:3000**

---

## Usando o VS Code

### Tarefas disponíveis

Pressione `Ctrl+Shift+P` → "Tasks: Run Task" para ver todas as tarefas:

| Tarefa | O que faz |
|--------|-----------|
| **AMPARO: Iniciar Tudo** | Inicia API + Frontend simultaneamente |
| **AMPARO: Iniciar API** | Inicia só a API Express (porta 8080) |
| **AMPARO: Iniciar Frontend** | Inicia só o Vite (porta 3000) |
| **AMPARO: Typecheck** | Verifica tipos TypeScript em todo o projeto |
| **AMPARO: Codegen (OpenAPI)** | Regenera hooks e schemas após mudar o openapi.yaml |
| **AMPARO: DB Push (Drizzle)** | Aplica mudanças de schema no banco |
| **AMPARO: Docker Compose Up** | Sobe todos os serviços Docker |
| **AMPARO: Docker Compose Down** | Para os serviços Docker |
| **AMPARO: Backup do Banco** | Gera backup comprimido do banco |

### Extensões recomendadas

O VS Code vai sugerir automaticamente instalar:

- **Prettier** — formatação automática de código
- **ESLint** — análise estática de código
- **Tailwind CSS IntelliSense** — autocomplete de classes CSS
- **GitLens** — histórico Git integrado
- **Docker** — gerenciamento de containers
- **Error Lens** — erros inline no editor
- **REST Client** — testar APIs diretamente no VS Code

### Atalhos úteis

| Atalho | Ação |
|--------|------|
| `Ctrl+Shift+P` | Paleta de comandos |
| `Ctrl+Shift+P` → "Tasks: Run Task" | Executar tarefas |
| `` Ctrl+` `` | Abrir terminal integrado |
| `Ctrl+Shift+B` | Build padrão (Iniciar Tudo) |
| `F5` | Iniciar debug da API |

---

## Variáveis de Ambiente

O arquivo `.env` (criado a partir de `.env.example`) contém todas as variáveis:

```env
# Banco de dados PostgreSQL
DATABASE_URL=postgresql://amparo:SUA_SENHA@localhost:5432/amparo
POSTGRES_DB=amparo
POSTGRES_USER=amparo
POSTGRES_PASSWORD=SUA_SENHA

# API
PORT=8080
NODE_ENV=development
SESSION_SECRET=TROQUE_POR_UMA_STRING_LONGA_E_ALEATORIA

# Frontend (dev local)
VITE_PORT=3000
BASE_PATH=/
```

> ⚠️ **Nunca faça commit do arquivo `.env`** — ele está no `.gitignore` automaticamente.

---

## Backup e Restauração

### Backup (PowerShell)

```powershell
# Com Docker rodando
.\scripts\db-backup.ps1

# O backup é salvo em .\backups\amparo_backup_YYYYMMDD_HHMMSS.sql.zip
```

### Restauração (PowerShell)

```powershell
.\scripts\db-restore.ps1 .\backups\amparo_backup_20250603_143022.sql.zip
```

### Backup manual via pgAdmin

1. Abra o pgAdmin
2. Navegue até: Servers → PostgreSQL → Databases → amparo
3. Clique com botão direito → Backup
4. Escolha formato "Plain" ou "Custom"
5. Clique em "Backup"

---

## Publicação no GitHub

### Primeira publicação

No terminal do VS Code:

```powershell
# Inicializar git (se ainda não foi feito)
git init
git add .
git commit -m "feat: initial AMPARO release with Windows support"

# Criar repositório em https://github.com/new e conectar
git remote add origin https://github.com/<seu-usuario>/amparo.git
git branch -M main
git push -u origin main
```

### Atualizações

```powershell
git add .
git commit -m "feat: descricao da mudanca"
git push
```

### Clonar em outro PC Windows

```powershell
git clone https://github.com/<seu-usuario>/amparo.git
cd amparo
.\scripts\setup.bat
```

---

## Solução de Problemas

### `pnpm install` falha com "permission denied"

Execute o PowerShell como **Administrador**, ou configure o npm:

```powershell
npm config set prefix "$env:APPDATA\npm"
```

### `pnpm: command not found` no PowerShell

```powershell
npm install -g pnpm@10
# Se não funcionar, reinicie o terminal após instalar o Node.js
```

### Erro de ExecutionPolicy no PowerShell

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### PostgreSQL `psql: error: connection refused`

Verifique se o serviço PostgreSQL está rodando:

1. Pressione `Win + R` → `services.msc`
2. Procure "postgresql" e inicie se estiver parado
3. Ou via PowerShell:

```powershell
Start-Service postgresql*
```

### Docker Desktop não inicia

- Certifique-se de que a virtualização está habilitada na BIOS
- No Windows 10/11: `wsl --install` para instalar o WSL2
- Reinicie após instalar o WSL2

### Porta 80 já em uso

Edite o `.env` e mude `WEB_PORT`:

```env
WEB_PORT=8090
```

Acesse em `http://localhost:8090`.

### `NODE_ENV` não reconhecido no CMD

Use PowerShell em vez do CMD. Ou defina a variável:

```powershell
$env:NODE_ENV = "development"
```

---

## Checklist Final

| Item | Status |
|------|--------|
| Node.js 20+ instalado | ✅ |
| pnpm instalado | ✅ |
| `pnpm install` concluído | ✅ |
| Arquivo `.env` criado | ✅ |
| Banco PostgreSQL configurado | ✅ |
| Sistema inicia sem erros | ✅ |
| Login funciona | ✅ |
| Compatível com Windows 10 | ✅ |
| Compatível com Windows 11 | ✅ |
| Executável via VS Code | ✅ |
| Sem dependência do Replit | ✅ |
| Sem dependência obrigatória do Linux | ✅ |
| GitHub pronto para push | ✅ |

---

*AMPARO — Cuidado e Bem-Estar*
