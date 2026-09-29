# Ledger — arquitetura do MVP

## Aplicação e páginas

React e TypeScript, com Vinext e convenções App Router. A pasta `app` contém a interface e a API; `lib/ledger.ts` centraliza as regras do dinheiro. Cloudflare Worker `ledgerv2` executa o servidor. Supabase Auth gere contas por email e palavra-passe; Supabase Postgres mantém os dados. Cada consulta e escrita valida o bearer token com `auth.getUser()` no servidor. O cliente da base de dados usa a identidade do utilizador e a chave pública, nunca uma chave de serviço. RLS restringe leitura, criação e atualização ao proprietário do registo.

Áreas: Dashboard; Categorias e detalhe; Movimentos; Objetivos; Definições. Navegação por fragmentos de URL, compatível com voltar/avançar no navegador. `/` encaminha para `/conta`, que exige sessão e envia visitantes para `/login`. `/login` reúne entrar, criar conta e pedir recuperação. `/auth/confirm` confirma o email e `/recuperar` permite definir uma nova palavra-passe a partir do link de recuperação. `/demo` é uma demonstração explicitamente identificada, só em memória, com dados fictícios.

Componentes: cartões de envelopes, resumo mensal, distribuição, lista de movimentos, formulário único de movimentos, editor de categoria, formulário de rendimento e onboarding em três passos. Primitivas acessíveis Shadcn/Radix para diálogo, confirmação, tabs, progresso, navegação, inputs e switches.

## Modelo de dados

Um registo `ledger_accounts` por utilizador: `user_id`, `revision`, `document`, `updated_at`.

O documento contém:

- Rendimento mensal habitual e primeiro mês.
- Categorias: id, nome, tipo (mensal/acumulativa), valor mensal, cor, ícone, objetivo em cêntimos e nome opcional.
- Meses: rendimento recebido, dinheiro transitado e distribuição por categoria.
- Movimentos: id, tipo, cêntimos, categoria, destino de transferência, descrição e data.

Os valores são inteiros em cêntimos. A identidade nunca vem do corpo do pedido. Uma atualização atómica guarda o estado inteiro apenas se a revisão corresponder à lida. Conflitos são devolvidos com 409, os dados são atualizados e os campos permanecem para o utilizador rever antes de guardar novamente. Isto impede transferências parciais e alterações concorrentes perdidas. A API limita o documento a 800 mil caracteres e a base de dados aplica também um limite de 1,5 MB; numa evolução para contas com grande histórico, as entidades deverão ser normalizadas.

## Fluxo principal

Criar conta → confirmar email → entrar → rendimento mensal → categorias e valores → confirmar → Dashboard → + Movimento → valor, categoria, tipo, descrição opcional e data → guardar.

## Regras do dinheiro

O rendimento indicado representa dinheiro recebido manualmente. Não há ligação ao banco. Cada mês seguinte é calculado uma vez a partir do rendimento habitual e da distribuição por categoria; a leitura calcula meses em falta e a próxima escrita persiste o resultado. As distribuições habituais nunca podem exceder o rendimento habitual.

Nas categorias mensais, as sobras voltam a «Por distribuir» no mês seguinte. Nas acumulativas, o dinheiro mantém-se no envelope. Dinheiro livre também transita. Assim não se perde dinheiro ao mudar de mês. O Dashboard inclui o saldo acumulado no total disponível e apresenta recebido e gasto apenas para o mês selecionado.

Entrada = dinheiro novo recebido diretamente no envelope. Distribuição = dinheiro livre colocado num envelope, sem aumentar rendimento. Transferência = diminuição na origem e aumento no destino, sem criar rendimento nem despesa.

Alterar orçamento ou rendimento afeta o mês atual e o valor habitual futuro. Meses fechados ficam preservados. O tipo de uma categoria já criada não muda para evitar reinterpretar saldos. Os movimentos só podem ser registados em datas válidas do mês atual até hoje. Despesas/transferências acima do saldo são rejeitadas. A eliminação de um movimento atual é permitida apenas se nenhum saldo ficar negativo.

## PWA, acessibilidade e privacidade

Manifesto, ícones, instalação quando suportada pelo navegador, service worker e página offline. Dados financeiros e respostas autenticadas não são colocados na cache offline. Consultar e guardar dados requer internet. O tema, a preferência de sons e a sessão do Supabase são guardados no dispositivo. Os dados financeiros ficam no Supabase e não são persistidos no navegador.

Modo escuro, foco visível, diálogos com foco controlado, labels, navegação por teclado, feedback de erro e sucesso, preferência de movimento reduzido. Sem analytics, bancos, recomendações financeiras ou serviços externos de imagem.

## Autenticação e publicação

O browser mantém um único cliente Supabase, renova a sessão e acompanha o logout. Os links de email usam PKCE e devem abrir no navegador onde o pedido começou; os callbacks também suportam `token_hash` para templates personalizados. Tokens são removidos do URL após a troca. A API verifica o utilizador independentemente do estado apresentado pela interface. Escritas com revisão desatualizada devolvem 409.

Produção: https://ledgerv2.dontspop.workers.dev. O comando `npm run deploy` constrói e publica o Worker existente. A migração em `supabase/migrations` cria `ledger_accounts`, constraints e políticas RLS. Os ficheiros D1/Drizzle anteriores são históricos e não estão ligados ao Worker atual.

A confirmação de email permanece ativa. Para aceitar registos públicos e enviar recuperação, configurar SMTP em Supabase → Authentication → Email → SMTP Settings. O serviço de email de teste atual limita destinatários. Não colocar a credencial SMTP no frontend ou no Git. Ver README para URLs de redirecionamento e validação.
