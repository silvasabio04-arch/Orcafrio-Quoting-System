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
- **Auth**: Clerk (Google login + email; Replit-managed)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### Orcafrio (`artifacts/orcafrio`)
Web app em português para geração de orçamentos de refrigeração/climatização.

**Authentication:**
- Clerk auth (Google + email). Todas as rotas protegidas exigem sessão ativa.
- 30 dias de teste gratuito a partir do primeiro login; após expirar → redireciona para `/trial-expired`.
- Landing page pública em `/` para usuários não autenticados.
- Usuário autenticado é redirecionado de `/` para `/inicio` (Dashboard).

**Features:**
- Dashboard com resumo de orçamentos (total, aprovados, pendentes, receita esperada)
- CRUD completo de orçamentos com itens (quantidade × preço unitário = subtotal calculado ao vivo)
- Categorias: manutenção preventiva, higienização, instalação, troca de compressor, carga de gás, diagnóstico, conserto, mão de obra, outros
- Campos: prazo de execução, validade, garantia, condições de pagamento, observações
- Status: rascunho → enviado → aprovado / recusado / cancelado
- Compartilhamento via WhatsApp (link `wa.me` com texto formatado)
- Versão de impressão/PDF via `@media print` — cabeçalho com logo e tagline "Orçamento Inteligente"
- CRUD de clientes com histórico de orçamentos
- **Mobile-first universal**: layout em coluna estreita (`max-w-md`) centralizada
- **Sugestão de preço por IA** — botão "Sugerir IA" em cada item
- **Sugestão de taxa de deslocamento por IA**

**Routes:**
- `/` — Landing page (não autenticado) ou redirect para `/inicio` (autenticado)
- `/sign-in/*?` — Login (Clerk)
- `/sign-up/*?` — Cadastro (Clerk)
- `/trial-expired` — Período de teste encerrado
- `/inicio` — Dashboard (protegido)
- `/orcamentos` — Lista com filtro por status (protegido)
- `/orcamentos/novo` — Criar orçamento (protegido)
- `/orcamentos/:id` — Ver detalhes + ações (protegido)
- `/orcamentos/:id/editar` — Editar (protegido)
- `/clientes` — Lista de clientes (protegido)
- `/clientes/novo` — Novo cliente (protegido)
- `/clientes/:id` — Detalhes do cliente (protegido)
- `/configuracoes` — Configurações do técnico (protegido)

### API Server (`artifacts/api-server`)
Express 5 server com rotas REST para clientes, orçamentos, itens e dashboard.

**Auth middleware**: `requireAuth` (`artifacts/api-server/src/middlewares/requireAuth.ts`)
- Verifica sessão Clerk via `getAuth(req)`
- Cria registro de usuário na tabela `users` no primeiro acesso (com `trialStartAt = now()`)
- Retorna 402 se período de teste encerrado e `isPaid = false`
- Define `req.userId` para uso nos handlers

**Clerk proxy**: montado em `/api/__clerk` via `clerkProxyMiddleware`

**Rotas IA (requerem auth):**
- `POST /api/sugestao-preco` — body: `{descricao, categoria, cidade?, estado?}` → `{precoMinimo, precoMaximo, precoSugerido, justificativa}`
- `POST /api/sugestao-deslocamento` — body: `{enderecoTecnico, enderecoCliente, distanciaKm?}` → `{distanciaEstimadaKm, taxaMinima, taxaMaxima, taxaSugerida, justificativa}`

## Hotmart Payment Integration

Fluxo: usuário clica "Comprar" → vai para checkout Hotmart → paga → Hotmart chama webhook → app libera acesso (`isPaid = true`).

**Setup (quando criar conta Hotmart):**
1. Criar produto na Hotmart com preço R$ 19,99 (pagamento único)
2. Copiar o link de checkout do produto
3. Em Ferramentas → Webhooks, configurar webhook apontando para: `https://<domínio-publicado>/api/hotmart/webhook`
4. Copiar o **Hottok** gerado pelo webhook

**Secrets necessários (adicionar na aba Secrets do Replit):**
- `HOTMART_HOTTOK` — token secreto para validar webhooks (segredo)
- `HOTMART_CHECKOUT_URL` — link de checkout público (ex: `https://pay.hotmart.com/XXXXXXX`)

**Endpoints:**
- `POST /api/hotmart/webhook` — recebe eventos da Hotmart, verifica hottok, atualiza `isPaid`
- `GET /api/payment/checkout-url` — retorna a URL de checkout para o frontend

**Eventos tratados:**
- `PURCHASE_COMPLETE` / `PURCHASE_APPROVED` → `isPaid = true`
- `PURCHASE_REFUNDED` / `PURCHASE_CHARGEBACK` / `PURCHASE_CANCELED` → `isPaid = false`

A liberação é feita por e-mail (campo `data.buyer.email` do webhook), que deve coincidir com o e-mail do login Google/Clerk do técnico.

## Database Schema

- `users` — user_id (PK, Clerk ID), email, trial_start_at, trial_days (30), is_paid, created_at
- `clientes` — id, user_id, nome, telefone, email, endereco, cpf_cnpj, created_at
- `orcamentos` — id, user_id, numero, cliente_id, status, prazo_execucao, validade_orcamento, garantia, condicoes_pagamento, observacoes, total, created_at, updated_at
- `itens_orcamento` — id, orcamento_id, categoria, descricao, quantidade, preco_unitario, subtotal

**Multi-tenancy**: todos os dados são filtrados por `user_id` — cada técnico vê apenas os seus próprios clientes e orçamentos.
