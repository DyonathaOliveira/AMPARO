# AMPARO — Sistema de Gestão para Casas de Repouso

> Sistema completo de gestão clínica para casas de repouso e cuidados com idosos.
> Desenvolvido para cuidadores, enfermeiros e gestores.

---

## Índice

- [Sobre o Sistema](#sobre-o-sistema)
- [Stack Tecnológico](#stack-tecnológico)
- [Início Rápido — Docker (Recomendado)](#início-rápido--docker-recomendado)
- [Instalação Manual (sem Docker)](#instalação-manual-sem-docker)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [Usuários de Demonstração](#usuários-de-demonstração)
- [Uso em Rede Local (Offline)](#uso-em-rede-local-offline)
- [Desenvolvimento no Replit](#desenvolvimento-no-replit)
- [Backup e Restauração](#backup-e-restauração)
- [Publicação no GitHub](#publicação-no-github)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Checklist de Independência do Replit](#checklist-de-independência-do-replit)

---

## Sobre o Sistema

O AMPARO é um sistema web de gestão para casas de repouso com as seguintes funcionalidades:

| Módulo | Descrição |
|--------|-----------|
| **Login** | Três perfis: Gestor, Enfermeiro, Cuidador |
| **Dashboard** | Resumo do turno, métricas, feed de atividades e gráfico de medicações |
| **Residentes** | Cadastro completo com prontuário, alergias, diagnósticos e contato familiar |
| **Medicamentos** | Controle de status (administrado/pendente/atrasado) e confirmação de administração |
| **Atividades** | Checklist diário por turno (banho, alimentação, fisioterapia etc.) |
| **Consultas** | Agendamento e controle de status por especialidade |
| **Passagem de Plantão** | Registro digital com confirmação de leitura obrigatória |
| **Alertas** | Central de alertas com severidade e resolução |
| **Relatórios** | Relatórios de turno com filtros |
| **Profissionais** | Gestão de equipe (exclusivo para Gestor) |

---

## Stack Tecnológico

```
Frontend    React 19 + Vite 7 + TypeScript + Tailwind CSS + shadcn/ui + Recharts
API         Node.js 24 + Express 5 + TypeScript
Banco       PostgreSQL 16 + Drizzle ORM
Validação   Zod + drizzle-zod
Contrato    OpenAPI 3.0 (contract-first — geração automática de hooks e schemas)
Monorepo    pnpm workspaces
Servidor    Nginx (produção)
```

---

## Início Rápido — Docker (Recomendado)

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) ou Docker Engine + Docker Compose (Linux)
- Git

### 1. Clonar o repositório

```bash
git clone https://github.com/<seu-usuario>/amparo.git
cd amparo
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e defina uma senha segura para o banco e a chave de sessão:

```env
POSTGRES_PASSWORD=minha_senha_segura_aqui
SESSION_SECRET=uma_chave_aleatoria_longa_de_32_caracteres_aqui
```

### 3. Subir todos os serviços

```bash
docker compose up -d
```

Isso irá:
1. Baixar a imagem do PostgreSQL 16
2. Criar o banco de dados com o schema completo e usuários de demonstração
3. Compilar e iniciar a API Express
4. Compilar o frontend React e servir via Nginx

### 4. Acessar o sistema

Abra o navegador em: **http://localhost**

> Na primeira execução, a compilação das imagens Docker pode levar 2–5 minutos.

### Comandos úteis

```bash
# Ver status dos containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f api
docker compose logs -f web

# Parar todos os serviços (preserva dados)
docker compose stop

# Parar e remover containers (preserva volume do banco)
docker compose down

# Parar e remover TUDO incluindo dados do banco ⚠️
docker compose down -v

# Reconstruir imagens após alterações no código
docker compose build --no-cache
docker compose up -d
```

---

## Instalação Manual (sem Docker)

Use este método se preferir gerenciar o PostgreSQL manualmente ou para desenvolvimento.

### Pré-requisitos

| Ferramenta | Versão mínima | Download |
|------------|---------------|----------|
| Node.js | 24.x | https://nodejs.org |
| pnpm | 10.x | `npm install -g pnpm@10` |
| PostgreSQL | 16.x | https://www.postgresql.org/download/ |

> **macOS/Windows — importante:** o arquivo `pnpm-workspace.yaml` contém overrides de plataforma otimizados para Linux x64 (ambiente Replit/Docker). Se quiser instalar dependências localmente em Mac ou Windows, remova temporariamente a seção `overrides` do `pnpm-workspace.yaml` antes de rodar `pnpm install`.

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Criar o banco de dados

```bash
# Conectar ao PostgreSQL e criar o banco
psql -U postgres -c "CREATE DATABASE amparo;"
psql -U postgres -c "CREATE USER amparo WITH PASSWORD 'amparo_secret';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE amparo TO amparo;"

# Aplicar o schema (tables + enums)
psql -U amparo -d amparo -f docker/init.sql
```

Ou alternativamente, use o Drizzle Kit para aplicar o schema:

```bash
DATABASE_URL=postgresql://amparo:amparo_secret@localhost:5432/amparo \
  pnpm --filter @workspace/db run push
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas configurações locais
```

### 4. Iniciar os serviços

Abra dois terminais:

**Terminal 1 — API:**
```bash
PORT=8080 DATABASE_URL=postgresql://amparo:amparo_secret@localhost:5432/amparo \
  SESSION_SECRET=desenvolvimento_secret \
  pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
PORT=3000 BASE_PATH=/ \
  pnpm --filter @workspace/amparo run dev
```

Acesse: **http://localhost:3000**

> No desenvolvimento manual, o frontend e a API rodam em portas separadas. O frontend precisa estar configurado para enviar requisições para `http://localhost:8080`. Se necessário, adicione um proxy no vite.config.standalone.ts.

### Build de Produção (sem Docker)

```bash
# Build da API
pnpm --filter @workspace/api-server run build
# Saída: artifacts/api-server/dist/index.mjs

# Build do Frontend (sem plugins Replit)
pnpm --filter @workspace/amparo run build:standalone
# Saída: artifacts/amparo/dist/public/

# Iniciar API em produção
PORT=8080 DATABASE_URL=<sua_url> SESSION_SECRET=<seu_secret> \
  node --enable-source-maps artifacts/api-server/dist/index.mjs

# Servir frontend com nginx, apache, ou qualquer servidor estático
# Aponte o root para: artifacts/amparo/dist/public/
```

---

## Variáveis de Ambiente

### Obrigatórias (produção)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL completa de conexão PostgreSQL | `postgresql://user:pass@host:5432/amparo` |
| `SESSION_SECRET` | Chave secreta para sessões HTTP (mín. 32 chars aleatórios) | `xk9...` |
| `PORT` | Porta da API Express | `8080` |

### Banco de dados (Docker Compose)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `POSTGRES_DB` | `amparo` | Nome do banco |
| `POSTGRES_USER` | `amparo` | Usuário do banco |
| `POSTGRES_PASSWORD` | `amparo_secret` | ⚠️ Altere em produção |
| `POSTGRES_PORT` | `5432` | Porta exposta do PostgreSQL |
| `WEB_PORT` | `80` | Porta exposta do frontend |

### Opcionais

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `NODE_ENV` | `production` | `development` ou `production` |
| `BASE_PATH` | `/` | Subdiretório caso sirva em `/amparo/` etc. |

---

## Banco de Dados

### Schema

O banco usa PostgreSQL 16 com as seguintes tabelas:

```
users                    — Profissionais da equipe (cuidadores, enfermeiros, gestores)
residents                — Residentes com prontuário completo
medications              — Medicamentos prescritos por residente
medication_administrations — Registros de administração de medicamentos
activities               — Atividades diárias (banho, alimentação etc.)
appointments             — Consultas médicas agendadas
handovers                — Passagens de plantão digitais
alerts                   — Central de alertas e notificações
```

### Enums (tipos enumerados)

```sql
user_role:        caregiver | nurse | manager
shift_type:       morning | afternoon | night
gender_type:      male | female | other
resident_status:  active | inactive
medication_status: administered | pending | late
activity_type:    bath | feeding | hygiene | physiotherapy | medication | other
activity_status:  completed | pending | not_done
activity_shift:   morning | afternoon | night
appointment_status: scheduled | confirmed | completed | cancelled
handover_shift:   morning | afternoon | night
alert_type:       medication | activity | appointment | incident
alert_severity:   low | medium | high | critical
```

### Inicialização automática (Docker)

O arquivo `docker/init.sql` é executado **automaticamente** pelo PostgreSQL na primeira vez que o container sobe (quando o volume `postgres_data` está vazio). Ele cria todas as tabelas, enums e os usuários de demonstração.

### Regenerar o schema após alterações no Drizzle

Se você alterar os arquivos em `lib/db/src/schema/`, aplique as mudanças:

```bash
# Em desenvolvimento (Replit ou local com Postgres rodando)
DATABASE_URL=<sua_url> pnpm --filter @workspace/db run push

# Em Docker
docker compose exec api sh -c "DATABASE_URL=\$DATABASE_URL npx drizzle-kit push"
```

---

## Usuários de Demonstração

| Perfil | E-mail | Senha | Acesso |
|--------|--------|-------|--------|
| Gestor | admin@amparo.com | 123456 | Todos os módulos + Gestão de Profissionais |
| Enfermeiro | enfermeiro@amparo.com | 123456 | Dashboard, Residentes, Medicamentos, Atividades, Consultas, Plantão, Alertas |
| Cuidador | cuidador@amparo.com | 123456 | Dashboard, Atividades, Alertas |

> ⚠️ **Segurança:** Em produção real, altere as senhas e implemente hash de senhas (bcrypt). A autenticação atual armazena senha em texto simples, adequada apenas para ambientes acadêmicos/demonstração.

---

## Uso em Rede Local (Offline)

O AMPARO é um sistema **multi-usuário** com banco de dados centralizado. Por isso, a melhor forma de operação "offline" (sem internet) é rodar o Docker em um computador local da casa de repouso, acessível por todos os dispositivos da rede interna.

### Configuração para rede local

1. **Instale o Docker** em um computador Windows/Mac/Linux na rede da casa de repouso
2. **Siga o início rápido** acima para subir os containers
3. **Descubra o IP local** do computador servidor:
   - Windows: `ipconfig` → "Endereço IPv4"
   - Mac/Linux: `ifconfig` ou `ip addr`
4. **Acesse de qualquer dispositivo** na mesma rede WiFi:
   ```
   http://192.168.1.XXX     (substitua pelo IP do servidor)
   ```

### Vantagens desta abordagem

- ✅ Funciona sem internet
- ✅ Dados compartilhados entre todos os profissionais em tempo real
- ✅ Qualquer dispositivo com navegador acessa (tablet, celular, PC)
- ✅ Backup simples com scripts incluídos
- ✅ Funciona em Windows, Mac e Linux

### Por que não Electron?

O Electron criaria **instâncias isoladas** em cada máquina, sem dados compartilhados entre os profissionais. Para um sistema multi-usuário com banco de dados relacional, o Docker em servidor local é a arquitetura correta.

### Instalar como PWA (opcional)

O sistema suporta instalação como Progressive Web App nos navegadores modernos. Para instalar:
- **Chrome/Edge**: Clique no ícone de instalação na barra de endereços
- **Android**: Menu → "Adicionar à tela inicial"
- **iOS Safari**: Compartilhar → "Adicionar à tela inicial"

Isso cria um atalho no dispositivo que abre o sistema em tela cheia, sem barra de navegador.

---

## Desenvolvimento no Replit

O projeto continua funcionando normalmente no Replit. As configurações Replit (`.replit`) são mantidas no repositório para que o ambiente seja reproduzível.

### Workflows Replit

| Workflow | Comando | Descrição |
|----------|---------|-----------|
| `amparo: web` | `pnpm --filter @workspace/amparo run dev` | Frontend em desenvolvimento |
| `api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | API Express |

### Codegen (após alterar openapi.yaml)

```bash
pnpm --filter @workspace/api-spec run codegen
```

Regenera: hooks React Query + schemas Zod a partir do contrato OpenAPI.

---

## Backup e Restauração

### Backup automático

```bash
# Fazer backup (gera arquivo comprimido em ./backups/)
./scripts/db-backup.sh

# Exemplo de saída:
# ✅ Backup concluído!
#    Arquivo: ./backups/amparo_backup_20250603_143022.sql.gz
#    Tamanho: 12K
```

### Restaurar backup

```bash
./scripts/db-restore.sh ./backups/amparo_backup_20250603_143022.sql.gz
```

### Backup manual com Docker

```bash
# Exportar dados
docker compose exec postgres pg_dump -U amparo amparo > backup_$(date +%Y%m%d).sql

# Importar dados
cat backup_20250603.sql | docker compose exec -T postgres psql -U amparo -d amparo
```

### Estratégia de backup recomendada

Para uso em produção, configure um cron job para backup diário:

```bash
# Adicionar ao crontab (crontab -e)
0 2 * * * /caminho/para/amparo/scripts/db-backup.sh >> /var/log/amparo-backup.log 2>&1
```

---

## Publicação no GitHub

### Primeira publicação

```bash
# 1. Inicializar git (se ainda não foi feito)
git init
git add .
git commit -m "feat: initial AMPARO release"

# 2. Criar repositório no GitHub (https://github.com/new)
# 3. Conectar e enviar
git remote add origin https://github.com/<seu-usuario>/amparo.git
git branch -M main
git push -u origin main
```

### Atualizações futuras

```bash
git add .
git commit -m "feat: descrição da mudança"
git push
```

### Boas práticas

- **Nunca faça commit do `.env`** — ele está no `.gitignore`
- Use `.env.example` para documentar as variáveis necessárias
- Use tags para versões: `git tag v1.0.0 && git push --tags`

---

## Estrutura do Projeto

```
amparo/
├── artifacts/
│   ├── amparo/                   # Frontend React + Vite
│   │   ├── src/
│   │   │   ├── components/       # shadcn/ui + componentes customizados
│   │   │   ├── pages/            # 13 páginas do sistema
│   │   │   ├── hooks/            # Hooks customizados
│   │   │   └── lib/              # Utilitários
│   │   ├── vite.config.ts        # Config Vite (Replit)
│   │   └── vite.config.standalone.ts  # Config Vite (produção independente)
│   └── api-server/               # API Express 5
│       └── src/
│           ├── routes/           # Endpoints REST
│           ├── lib/              # Auth, logger, helpers
│           └── app.ts            # Configuração Express
├── lib/
│   ├── db/                       # Drizzle ORM + schema PostgreSQL
│   ├── api-spec/                 # Contrato OpenAPI 3.0 (fonte da verdade)
│   ├── api-client-react/         # Hooks React Query (gerado automaticamente)
│   └── api-zod/                  # Schemas Zod (gerado automaticamente)
├── docker/
│   ├── nginx.conf                # Configuração Nginx (proxy + SPA)
│   └── init.sql                  # Schema SQL + dados demo (inicialização)
├── scripts/
│   ├── db-backup.sh              # Script de backup do banco
│   └── db-restore.sh             # Script de restauração do banco
├── attached_assets/              # Logo e assets do projeto
├── Dockerfile.api                # Imagem Docker da API
├── Dockerfile.web                # Imagem Docker do frontend (Nginx)
├── docker-compose.yml            # Orquestração completa do stack
├── .env.example                  # Template de variáveis de ambiente
├── pnpm-workspace.yaml           # Configuração do monorepo pnpm
└── README.md                     # Este arquivo
```

---

## Checklist de Independência do Replit

| Item | Status | Detalhes |
|------|--------|----------|
| Sem dependência de auth Replit | ✅ | Autenticação própria em memória (sessões HTTP) |
| Sem armazenamento Replit | ✅ | PostgreSQL standalone |
| Sem URLs exclusivas Replit | ✅ | Nginx + domínio próprio |
| Plugins Replit removidos da build | ✅ | `vite.config.standalone.ts` sem `@replit/*` |
| Dockerfile API | ✅ | Multi-stage, Node.js 24 slim |
| Dockerfile Frontend | ✅ | Multi-stage, Nginx Alpine |
| docker-compose.yml | ✅ | Postgres + API + Web, volumes persistentes |
| Schema SQL inicial | ✅ | `docker/init.sql` com tabelas e enums |
| `.env.example` | ✅ | Todas as variáveis documentadas |
| `.gitignore` atualizado | ✅ | `.env`, backups, builds excluídos |
| Scripts de backup/restore | ✅ | `scripts/db-backup.sh` e `db-restore.sh` |
| README completo | ✅ | Este documento |
| Estratégia offline | ✅ | Docker em rede local (multi-usuário, sem internet) |
| GitHub-ready | ✅ | Estrutura limpa, sem segredos commitados |

---

## Relatório Técnico de Migração

### Dependências Replit identificadas e tratamento

| Dependência | Tipo | Solução |
|-------------|------|---------|
| `@replit/vite-plugin-runtime-error-modal` | Plugin Vite (overlay de erros) | Omitido no `vite.config.standalone.ts` |
| `@replit/vite-plugin-cartographer` | Plugin Vite (mapa de arquivos) | Já condicional (`REPL_ID !== undefined`) — sem impacto externo |
| `@replit/vite-plugin-dev-banner` | Plugin Vite (banner dev) | Já condicional — sem impacto externo |
| `PORT` obrigatório no Vite config | Variável de ambiente Replit | `vite.config.standalone.ts` usa padrão `3000` |
| `BASE_PATH` obrigatório no Vite config | Variável de ambiente Replit | `vite.config.standalone.ts` usa padrão `/` |
| PostgreSQL Replit | Banco de dados da plataforma | Container Docker próprio |
| Proxy Replit (path routing) | Infraestrutura Replit | Nginx com `proxy_pass` para API |
| pnpm overrides linux-x64 only | Otimização Replit | Perfeito para Docker; macOS/Windows: remover seção `overrides` |

### Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Senhas em texto simples no banco | Documentado; para produção real implementar bcrypt |
| Sessões em memória (perdidas ao reiniciar) | Documentado; para produção implementar Redis ou sessões no banco |
| Sem HTTPS por padrão | Para produção: adicionar certificado SSL no Nginx (Let's Encrypt) |
| Backup manual | Scripts incluídos + instruções de cron job |

---

*AMPARO — Cuidado e Bem-Estar*
