# Ledger

Finanças pessoais organizadas em envelopes. Português de Portugal, euros, tema claro/escuro e PWA.

Produção: https://ledger.dontspop.workers.dev

## Desenvolvimento

Node.js 22.13 ou superior.

```sh
npm ci
npm run dev
```

Cloudflare executa a aplicação; Supabase fornece autenticação e base de dados. A configuração pública fica em `lib/supabase-config.ts`. Nenhuma chave de serviço é necessária. O ambiente local usa o mesmo projeto Supabase: usar uma conta exclusiva de testes, nunca dados reais para os testes automatizados. `/demo` tem dados fictícios apenas em memória.

## Autenticação

Login, registo com confirmação por email, reenvio da confirmação, recuperação e logout estão implementados. No Supabase, configurar:

- Site URL: `https://ledger.dontspop.workers.dev`
- Redirect URLs: `https://ledger.dontspop.workers.dev`, `https://ledger.dontspop.workers.dev/auth/confirm` e `https://ledger.dontspop.workers.dev/recuperar`.
- Para desenvolvimento com emails, adicionar explicitamente os callbacks correspondentes do localhost.
- SMTP próprio em Authentication → Email → SMTP Settings, com remetente/domínio verificado. A credencial fica exclusivamente no Supabase.

**Pendente operacional:** o Supabase ainda usa o serviço de envio de teste, limitado a destinatários autorizados. O registo público e a recuperação por email precisam do SMTP. A confirmação de email permanece ativa. Os links PKCE devem abrir no mesmo navegador onde foram pedidos. Os [passos de configuração e templates](docs/EMAIL.md) estão preparados para ativação.

A migração `supabase/migrations/20260921214258_ledger_accounts.sql` já foi aplicada ao projeto Ledger. Cada conta só pode ler e alterar os seus dados por políticas RLS. A antiga base D1 estava vazia e deixou de ser usada.

## Verificar e publicar

```sh
npm run typecheck
npm test
npm run test:api
npm run deploy
```

`test:api` verifica por defeito rejeição de pedidos sem sessão ou com token inválido em localhost:5173. Opcionalmente definir `LEDGER_TEST_BASE_URL`. Para testar persistência e concorrência, definir `LEDGER_TEST_EMAIL` e `LEDGER_TEST_PASSWORD` no ambiente com uma conta dedicada já configurada e pelo menos duas categorias. O teste acrescenta e remove movimentos próprios e nunca deve correr numa conta pessoal. Não guardar credenciais no repositório. Sem estas variáveis, o teste autenticado é explicitamente omitido.

O deploy requer Wrangler autenticado na conta Cloudflare e atualiza o Worker `ledger`. O endereço antigo Sites é histórico; não faz parte deste deploy.

A [arquitetura](docs/ARQUITETURA.md) documenta páginas, componentes, modelo e regras. A PWA precisa de internet para consultar/gravar; dados privados não entram na cache offline.

## Funcionalidades

- Onboarding com rendimento e distribuição.
- Categorias mensais e acumulativas, cores e ícones editáveis.
- Despesas, entradas, distribuição e transferências atómicas.
- Objetivos, progresso e histórico com filtros.
- Sobras mensais voltam a ficar por distribuir.
- Autenticação, persistência por utilizador e controlo de concorrência.
- Design responsivo, teclado, modo escuro e sons opcionais.
