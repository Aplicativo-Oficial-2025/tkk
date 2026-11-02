export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Webhook-Event, User-Agent'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const webhookEvent = req.headers['x-webhook-event'] || (req.body && req.body.event);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    console.log(`[InvictusPay Webhook] Evento recebido: ${webhookEvent}`);
    if (body.transaction) {
      console.log(`[InvictusPay Webhook] Transação: ${body.transaction.id} | Status: ${body.transaction.status} | Valor: R$ ${(body.transaction.amount / 100).toFixed(2)}`);
    }

    // Responder HTTP 200 rápido conforme documentação
    return res.status(200).json({ success: true, message: 'Webhook processado com sucesso.' });
  } catch (error) {
    console.error('[InvictusPay Webhook] Erro ao processar:', error);
    return res.status(200).json({ success: true, note: 'Error handled' });
  }
}
