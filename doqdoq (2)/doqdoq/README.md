# Ampara Brasil — Integração Pix (InvictusPay v1)

Este projeto possui a integração completa com a API Seller (v1) da **InvictusPay** para geração e confirmação automática de pagamentos via Pix.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js instalado (v18 ou superior).

### Inicialização Rápida
Abra o terminal na pasta do projeto e execute:

```bash
npm start
```
ou
```bash
node server.js
```

Acesse no navegador:
👉 [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Variáveis de Ambiente (`.env` e `.env.local`)

As credenciais já estão configuradas:

```env
INVICTUSPAY_PUBLIC_KEY=silvasilvabussines_tucs23b2kazhdwiu
INVICTUSPAY_API_KEY=sk_vvWrxA7wooqFINQwgow45WdZCFWWDVo9fnyVN9CfAUhaGp75b3pCBtrR
INVICTUSPAY_BASE_URL=https://api.invictuspayv2.com.br/api/v1
PORT=3000
```

---

## 📌 Endpoints Implementados

1. **`POST /api/gerar-pix`**
   - Cria uma transação Pix via `POST https://api.invictuspayv2.com.br/api/v1/transactions`.
   - Gera e retorna o código **Pix Copia e Cola** e o **QR Code**.

2. **`GET /api/consultar-pix?id={txId}`**
   - Consulta o status da transação via `GET https://api.invictuspayv2.com.br/api/v1/transactions/{txId}`.
   - Retorna `{ paid: true }` quando o pagamento for concluído.

3. **`POST /api/webhook`**
   - Endpoint pronto para receber eventos da InvictusPay (ex: `EVENT:CHARGE_PAID`).

4. **`GET /obrigado.html?tx={txId}&amount={valor}`**
   - Página de agradecimento exibida automaticamente após a confirmação do pagamento.

---

## 🌐 Deploy na Vercel

O projeto já inclui:
- `vercel.json`
- Funções serverless em `/api/`

Para publicar na Vercel:
1. Suba o projeto para um repositório Git ou utilize a CLI da Vercel (`vercel`).
2. Adicione as variáveis de ambiente no painel da Vercel:
   - `INVICTUSPAY_PUBLIC_KEY`
   - `INVICTUSPAY_API_KEY`
