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
