# Ledger — arquitetura do MVP

## Aplicação e páginas

React e TypeScript, com Vinext e convenções App Router. A pasta `app` contém a interface e a API; `lib/ledger.ts` centraliza as regras do dinheiro. Cloudflare Worker executa o servidor e D1 mantém os dados. A autenticação usa «Entrar com ChatGPT», fornecida pela plataforma Sites. Cada consulta e escrita verifica a identidade no servidor.

Áreas: Dashboard; Categorias e detalhe; Movimentos; Objetivos; Definições. Navegação por fragmentos de URL, compatível com voltar/avançar no navegador. `/` apresenta entrada ou a conta autenticada. `/demo` é uma demonstração explicitamente identificada, só em memória, com dados fictícios.

Componentes: cartões de envelopes, resumo mensal, distribuição, lista de movimentos, formulário único de movimentos, editor de categoria, formulário de rendimento e onboarding em três passos. Primitivas acessíveis Shadcn/Radix para diálogo, confirmação, tabs, progresso, navegação, inputs e switches.

## Modelo de dados

Um registo `ledger_accounts` por utilizador: `user_id`, `revision`, `document`, `updated_at`.

O documento contém:

- Rendimento mensal habitual e primeiro mês.
- Categorias: id, nome, tipo (mensal/acumulativa), valor mensal, cor, ícone, objetivo em cêntimos e nome opcional.
- Meses: rendimento recebido, dinheiro transitado e distribuição por categoria.
- Movimentos: id, tipo, cêntimos, categoria, destino de transferência, descrição e data.

Os valores são inteiros em cêntimos. A identidade nunca vem do corpo do pedido. Uma atualização atómica guarda o estado inteiro apenas se a revisão corresponder à lida. Conflitos são devolvidos com 409, os dados são atualizados e os campos permanecem para o utilizador rever antes de guardar novamente. Isto impede transferências parciais e alterações concorrentes perdidas. O documento tem um limite de 800 mil caracteres; numa evolução para contas com grande histórico, as entidades deverão ser normalizadas.

## Fluxo principal

Entrar → rendimento mensal → categorias e valores → confirmar → Dashboard → + Movimento → valor, categoria, tipo, descrição opcional e data → guardar.

## Regras do dinheiro

O rendimento indicado representa dinheiro recebido manualmente. Não há ligação ao banco. Cada mês seguinte é calculado uma vez a partir do rendimento habitual e da distribuição por categoria; a leitura calcula meses em falta e a próxima escrita persiste o resultado. As distribuições habituais nunca podem exceder o rendimento habitual.

Nas categorias mensais, as sobras voltam a «Por distribuir» no mês seguinte. Nas acumulativas, o dinheiro mantém-se no envelope. Dinheiro livre também transita. Assim não se perde dinheiro ao mudar de mês. O Dashboard inclui o saldo acumulado no total disponível e apresenta recebido e gasto apenas para o mês selecionado.

Entrada = dinheiro novo recebido diretamente no envelope. Distribuição = dinheiro livre colocado num envelope, sem aumentar rendimento. Transferência = diminuição na origem e aumento no destino, sem criar rendimento nem despesa.

Alterar orçamento ou rendimento afeta o mês atual e o valor habitual futuro. Meses fechados ficam preservados. O tipo de uma categoria já criada não muda para evitar reinterpretar saldos. Os movimentos só podem ser registados em datas válidas do mês atual até hoje. Despesas/transferências acima do saldo são rejeitadas. A eliminação de um movimento atual é permitida apenas se nenhum saldo ficar negativo.

## PWA, acessibilidade e privacidade

Manifesto, ícones, instalação quando suportada pelo navegador, service worker e página offline. Dados financeiros e respostas autenticadas não são colocados na cache offline. Consultar e guardar dados requer internet. Apenas tema e preferência de sons são guardados no dispositivo.

Modo escuro, foco visível, diálogos com foco controlado, labels, navegação por teclado, feedback de erro e sucesso, preferência de movimento reduzido. Sem analytics, bancos, recomendações financeiras ou serviços externos de imagem.
