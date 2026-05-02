# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Orcafrio (`artifacts/orcafrio`)
Web app em português para geração de orçamentos de refrigeração/climatização.

**Features:**
- Dashboard com resumo de orçamentos (total, aprovados, pendentes, receita esperada)
- CRUD completo de orçamentos com itens (quantidade × preço unitário = subtotal calculado ao vivo)
- Categorias: manutenção preventiva, higienização, instalação, troca de compressor, carga de gás, diagnóstico, conserto, mão de obra, outros
- Campos: prazo de execução, validade, garantia, condições de pagamento, observações
- Status: rascunho → enviado → aprovado / recusado / cancelado
- Compartilhamento via WhatsApp (link `wa.me` com texto formatado)
- Versão de impressão/PDF via `@media print`
- CRUD de clientes com histórico de orçamentos
- Mobile-first, todo em português

**Routes:**
- `/` — Dashboard
- `/orcamentos` — Lista com filtro por status
- `/orcamentos/novo` — Criar orçamento
- `/orcamentos/:id` — Ver detalhes + ações
- `/orcamentos/:id/editar` — Editar
- `/clientes` — Lista de clientes
- `/clientes/novo` — Novo cliente
- `/clientes/:id` — Detalhes do cliente

### API Server (`artifacts/api-server`)
Express 5 server com rotas REST para clientes, orçamentos, itens e dashboard.

## Database Schema

- `clientes` — id, nome, telefone, email, endereco, cpf_cnpj, created_at
- `orcamentos` — id, numero, cliente_id, status, prazo_execucao, validade_orcamento, garantia, condicoes_pagamento, observacoes, total, created_at, updated_at
- `itens_orcamento` — id, orcamento_id, categoria, descricao, quantidade, preco_unitario, subtotal
