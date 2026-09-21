# Ledger

Aplicação de finanças pessoais organizada em envelopes. Interface em português de Portugal, euros, tema claro/escuro e PWA.

## Desenvolvimento

Requer Node.js 22.13 ou superior.

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_nebulous_darkhawk.sql
npm run dev
```

Aplica a migração apenas uma vez por base de dados local. O servidor imprime o endereço de acesso. Em desenvolvimento no loopback, «Entrar com ChatGPT» usa a identidade local simulada pelo starter. Na versão alojada, a autenticação é real e fornecida pela plataforma. `/demo` contém exemplos fictícios e não guarda alterações.

```sh
node --experimental-strip-types --test tests/ledger.test.ts
npx tsc --noEmit
npm run build
```

A [arquitetura](docs/ARQUITETURA.md) descreve páginas, componentes, modelo de dados e regras. O MVP precisa de internet para ler/gravar dados. A PWA apresenta uma página informativa sem ligação.

## Funcionalidades

- Onboarding com rendimento e distribuição.
- Categorias mensais e acumulativas, cores e ícones editáveis.
- Despesas, entradas, distribuição e transferências atómicas.
- Objetivos, progresso e histórico com filtros.
- Sobras mensais voltam a ficar por distribuir.
- Autenticação, persistência por utilizador e controlo de concorrência.
- Design responsivo, acessibilidade por teclado, modo escuro e sons opcionais.
