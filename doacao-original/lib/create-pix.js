const API_URL = 'https://api.invictuspayv2.com.br/api/v1/transactions';

async function createPix(req, res) {
  const amount = Number(req.body?.amount);
  if (!Number.isInteger(amount) || amount < 100 || amount > 1000000) {
    return res.status(400).json({ error: 'Valor inválido (centavos).' });
  }

  if (process.env.PAYMENTS_ENABLED !== 'true') {
    return res.status(503).json({ error: 'Pagamento indisponível: os pagamentos reais estão desativados.' });
  }

  const apiKey = process.env.INVICTUS_API_KEY;
  const offerHash = process.env.INVICTUS_OFFER_HASH;
  if (!apiKey || !offerHash) {
    return res.status(503).json({ error: 'Pagamento indisponível: configure as variáveis privadas da InvictusPay.' });
  }

  const submittedCustomer = req.body?.customer;
  if (!submittedCustomer || typeof submittedCustomer !== 'object' || Array.isArray(submittedCustomer)) {
    return res.status(400).json({ error: 'Informe os dados do pagador.' });
  }

  const name = typeof submittedCustomer.name === 'string' ? submittedCustomer.name.trim() : '';
  const email = typeof submittedCustomer.email === 'string' ? submittedCustomer.email.trim() : '';
  const document = typeof submittedCustomer.document === 'string' ? submittedCustomer.document.replace(/\D/g, '') : '';
  const phone = typeof submittedCustomer.phone === 'string' ? submittedCustomer.phone.replace(/\D/g, '') : '';
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 || ![11, 14].includes(document.length) || ![10, 11].includes(phone.length)) {
    return res.status(400).json({ error: 'Confira nome, e-mail, CPF/CNPJ e telefone com DDD.' });
  }

  const payload = {
    amount,
    paymentMethod: 'pix',
    customer: { name, email, document, phone },
    items: [{ quantity: 1, amount, offer_hash: offerHash }],
    pix: { expirationInSeconds: 1800 }
  };

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Falha ao conectar à API da InvictusPay.', error);
    return res.status(502).json({ error: 'Não foi possível conectar à InvictusPay.' });
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    console.error('A InvictusPay retornou uma resposta que não é JSON.', error);
    return res.status(502).json({ error: 'A resposta da InvictusPay não pôde ser lida.' });
  }

  if (!response.ok) {
    console.error(`A InvictusPay recusou a criação do Pix (HTTP ${response.status}).`);
    return res.status(502).json({ error: 'A InvictusPay não conseguiu criar o Pix. Verifique a chave e a oferta configuradas.' });
  }

  return res.status(201).json(result);
}

module.exports = createPix;