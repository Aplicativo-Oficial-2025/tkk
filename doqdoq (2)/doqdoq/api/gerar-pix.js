// Validador e gerador de CPF válido (algoritmo Módulo 11)
function isValidCPF(cpf) {
  if (!cpf) return false;
  const clean = String(cpf).replace(/\D/g, '');
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(clean.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(clean.substring(10, 11))) return false;
  return true;
}

function generateValidCPF() {
  const rnd = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, rnd);
  let d1 = n.reduce((acc, val, i) => acc + val * (10 - i), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  n.push(d1);
  let d2 = n.reduce((acc, val, i) => acc + val * (11 - i), 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  n.push(d2);
  return n.join('');
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Api-Key, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // Tratamento e validação do valor
    let rawAmount = body.amount;
    if (typeof rawAmount === 'string') {
      rawAmount = parseFloat(rawAmount.replace(/\./g, '').replace(',', '.'));
    }
    let numAmount = parseFloat(rawAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valor de doação inválido.' });
    }

    // Regra InvictusPay: Valores monetários sempre em centavos (min_cents: 500 = R$ 5,00)
    let amountCents = Math.round(numAmount * 100);
    if (amountCents < 500) {
      amountCents = 500; // Ajuste para mínimo aceito
      numAmount = 5.0;
    }

    // Configurações da API InvictusPay
    const apiKey = process.env.INVICTUSPAY_API_KEY || 'sk_vvWrxA7wooqFINQwgow45WdZCFWWDVo9fnyVN9CfAUhaGp75b3pCBtrR';
    const baseUrl = (process.env.INVICTUSPAY_BASE_URL || 'https://api.invictuspayv2.com.br/api/v1').replace(/\/$/, '');

    // Dados do Cliente
    let name = (body.name && String(body.name).trim()) || 'Doador Ampara Brasil';
    let email = (body.email && String(body.email).trim()) || `doador.${Date.now()}.${Math.floor(Math.random() * 1000)}@amparabrasil.org`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      email = `doador.${Date.now()}@amparabrasil.org`;
    }

    let phone = (body.phone && String(body.phone).replace(/\D/g, '')) || '';
    if (phone.length < 10 || phone.length > 11) {
      phone = '1198' + Math.floor(1000000 + Math.random() * 9000000);
    }

    let document = (body.document || body.cpf || '').replace(/\D/g, '');
    if (!isValidCPF(document)) {
      document = generateValidCPF();
    }

    const description = body.description || 'Doação Luís Miguel - Ampara Brasil';

    // Monta payload conforme a documentação InvictusPay Seller v1
    const transactionPayload = {
      amount: amountCents,
      paymentMethod: 'pix',
      customer: {
        name: name,
        email: email,
        document: document,
        phone: phone
      },
      items: [
        {
          description: description,
          quantity: 1,
          amount: amountCents
        }
      ],
      pix: {
        expirationInSeconds: 1800
      }
    };

    if (body.postbackUrl && String(body.postbackUrl).startsWith('https://')) {
      transactionPayload.postbackUrl = body.postbackUrl;
    }

    const response = await fetch(`${baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(transactionPayload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[InvictusPay] Erro ao criar transação:', data);
      const errMsg = (data && data.message) || (data && data.error) || 'Erro ao gerar cobrança Pix na InvictusPay.';
      return res.status(response.status || 502).json({
        success: false,
        error: errMsg,
        details: data
      });
    }

    const tx = data.data;
    if (!tx || !tx.pix || !tx.pix.qr_code) {
      console.error('[InvictusPay] Resposta sem chave Pix:', data);
      return res.status(502).json({
        success: false,
        error: 'A API da InvictusPay não retornou o código Pix.'
      });
    }

    const qrCode = tx.pix.qr_code;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(qrCode)}`;

    return res.status(200).json({
      success: true,
      id: tx.id,
      status: tx.status,
      pix_code: qrCode,
      qr_code_url: qrCodeUrl,
      amount: numAmount,
      amount_cents: amountCents,
      formatted_amount: `R$ ${numAmount.toFixed(2).replace('.', ',')}`
    });

  } catch (error) {
    console.error('[InvictusPay] Exceção em /api/gerar-pix:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar a doação Pix.',
      message: error.message
    });
  }
}
