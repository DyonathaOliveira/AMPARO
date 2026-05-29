# AMPARO — Cuidado e Bem-Estar

Sistema de gestão para casas de repouso e cuidados com idosos, desenvolvido para cuidadores, enfermeiros e gestores.

## Run & Operate

- `pnpm --filter @workspace/amparo run dev` — run the frontend (porta dinâmica via PORT)
- `pnpm --filter @workspace/api-server run dev` — run the API server (porta dinâmica via PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter, TanStack Query, shadcn/ui, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — React Query hooks (auto-generated)
- `lib/api-zod/src/generated/` — Zod validation schemas (auto-generated)
- `lib/db/src/schema/` — Drizzle ORM tables (users, residents, medications, activities, appointments, handovers, alerts)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/amparo/src/` — React frontend
- `attached_assets/` — AMPARO logo and project docs

## Architecture decisions

- Contract-first OpenAPI design: spec gates codegen which gates frontend hooks
- Auth is session-based with in-memory token store (simulated for academic project)
- Medications have a status lifecycle: pending → administered | late
- Handover confirmation is required before accessing dashboard (enforced in frontend)
- All forms use React Hook Form + Zod validation

## Product

O AMPARO é um sistema de gestão para casas de repouso com as seguintes funcionalidades:
- **Login** com três perfis: Enfermeiro, Cuidador e Gestor
- **Dashboard** com resumo do turno, métricas, feed de atividades recentes e gráfico de medicações
- **Cadastro de Residentes** com prontuário completo
- **Controle de Medicamentos** com status (administrado/pendente/atrasado) e confirmação de administração
- **Atividades Diárias** com checklist por turno
- **Consultas** com agendamento e controle de status
- **Passagem de Plantão** digital com confirmação de leitura obrigatória
- **Central de Alertas** com severidade e resolução
- **Relatórios** de turno com filtros e exportação simulada

## User preferences

- Sistema em português do Brasil
- Identidade visual: azul institucional + branco + cinza suave, baseada na logomarca AMPARO
- Código organizado, componentizado, seguindo boas práticas de UX/UI

## Usuários de demonstração

| E-mail | Senha | Perfil |
|--------|-------|--------|
| enfermeira@amparo.com | amparo123 | Enfermeiro |
| cuidador@amparo.com | amparo123 | Cuidador |
| gestor@amparo.com | amparo123 | Gestor |

## Gotchas

- Rodar codegen após qualquer mudança no openapi.yaml: `pnpm --filter @workspace/api-spec run codegen`
- Auth token é armazenado em memória no servidor — reiniciar o servidor apaga as sessões
- Atividades usam enum `activity_shift` separado do enum `shift_type` dos usuários (ambos no banco)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
