# Ativar os emails da Ledger

Estado: templates preparados, mas ainda não aplicados ao Supabase. Falta escolher/configurar SMTP. O deploy Cloudflare não ativa estes templates automaticamente.

## Configuração simples com Resend

1. Criar uma conta no Resend e verificar um domínio próprio com os registos DNS fornecidos pelo serviço. A aplicação pode continuar em workers.dev; o domínio serve apenas para o remetente.
2. Criar uma chave de envio limitada ao domínio verificado.
3. Em Supabase → projeto Ledger → Authentication → Email → SMTP Settings, ativar SMTP e preencher:

| Campo | Valor |
| --- | --- |
| Sender name | Ledger |
| Sender email | Um endereço do domínio verificado |
| Host | smtp.resend.com |
| Port | 465 |
| Username | resend |
| Password | Chave Resend, introduzida diretamente no Supabase |

Não enviar a chave em conversas, guardar no Git ou colocar no frontend. Manter a confirmação de email ativa. Se o fornecedor tiver rastreamento de cliques, desativá-lo para estes emails de autenticação.

## Templates

No mesmo ecrã, em Email Templates:

- Confirm sign up: assunto **Confirma o teu email — Ledger**; conteúdo de `supabase/templates/confirmation.html`.
- Reset password: assunto **Recuperar acesso — Ledger**; conteúdo de `supabase/templates/recovery.html`.

Ambos usam a variável oficial `{{ .ConfirmationURL }}`. Não substituir por um link fixo: o Supabase gera o link individual e conserva o destino de cada fluxo. Os templates não expõem valores financeiros nem dados do perfil.

## Validação após ativar

Usar uma conta de teste e email controlado pelo proprietário:

1. Criar conta, receber confirmação e abrir o link no mesmo navegador.
2. Completar o onboarding, guardar um movimento e recarregar para confirmar persistência.
3. Sair e entrar com a mesma conta.
4. Pedir recuperação, seguir o link e definir uma nova palavra-passe.
5. Confirmar que a nova palavra-passe permite entrar e a anterior é rejeitada.

Os passos que enviam emails ou mudam palavras-passe ainda não foram executados nesta configuração. O serviço padrão do Supabase só entrega emails aos endereços autorizados da equipa, por isso não substitui SMTP para registo público.

Fontes oficiais consultadas em 22/09/2026:
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://resend.com/docs/send-with-supabase-smtp

## Estado verificado em 29/09/2026

- Produção atual: `https://ledgerv2.dontspop.workers.dev` (repositório `RuiDiniz02/Ledgerv2`).
- Site URL do Supabase corrigido para esse endereço, sem o prefixo literal `Site URL:` que causava erro 500 na confirmação.
- Adicionados os redirects exatos da v2: raiz, `/auth/confirm` e `/recuperar`. Os três redirects do Worker antigo foram preservados por compatibilidade.
- A configuração local de publicação passou a usar o Worker `ledgerv2`.
- SMTP próprio continua pendente de conta e remetente verificado. Não foi realizado teste de entrega ponta a ponta.

### Alternativa sem domínio próprio

O site pode permanecer no endereço gratuito `workers.dev`. O SMTP2GO permite um remetente individual verificado por email, sujeito às restrições DMARC do endereço escolhido e à aprovação da conta. O plano gratuito tem 1.000 emails/mês, 200/dia e, sem domínio verificado, 25/hora. Confirmar os limites no fornecedor antes da ativação.

1. Criar/entrar na conta SMTP2GO e verificar o endereço remetente em Sending → Verified Senders → Single sender emails.
2. Obter as credenciais SMTP no painel do fornecedor e introduzi-las diretamente no Supabase, sem Git nem chat.
3. Ativar SMTP no Supabase com nome Ledger e o remetente verificado; usar o host, porta e credenciais indicados pelo fornecedor.
4. Desativar rastreamento de cliques, aplicar os templates acima e ajustar o limite de envio do Supabase aos limites do fornecedor.
5. Executar o roteiro de validação acima na v2, usando uma conta de teste autorizada.

Fontes: https://support.smtp2go.com/hc/en-gb/articles/223087947-Free-Plan e https://support.smtp2go.com/hc/en-gb/articles/115004408567-Verified-Senders .
