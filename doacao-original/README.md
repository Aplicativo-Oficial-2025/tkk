# Ampara Brasil

## Executar localmente
1. Instale Node.js 18+ e execute `npm install`.
2. Copie `.env.example` para `.env` e preencha `INVICTUS_API_KEY` e `INVICTUS_OFFER_HASH` com valores válidos da sua conta.
3. Mantenha `PAYMENTS_ENABLED=false` até validar a campanha e a conta recebedora. Para habilitar cobranças reais, altere para `true` no ambiente do servidor.
4. Execute `npm start` e abra http://localhost:3000.

O endpoint `POST /api/pix` envia valores em centavos e os dados exigidos do pagador para a InvictusPay. A chave fica somente no servidor. Nunca coloque credenciais no HTML ou em arquivos versionados. Revogue qualquer chave compartilhada em mensagens e configure uma nova no ambiente privado do servidor.

## Vercel
Importe o repositório na Vercel e configure `INVICTUS_API_KEY`, `INVICTUS_OFFER_HASH` e `PAYMENTS_ENABLED` em Project Settings > Environment Variables. Deixe `PAYMENTS_ENABLED=false` até validar a campanha e a conta recebedora; a função `/api/pix` retornará indisponível enquanto estiver desativado.
