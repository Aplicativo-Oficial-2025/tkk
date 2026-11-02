export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Api-Key, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    const txId = (req.query && (req.query.id || req.query.order_id)) || url.searchParams.get('id') || url.searchParams.get('order_id');

    if (!txId) {
      return res.status(400).json({ success: false, error: 'ID da transação não fornecido.' });
    }

    const apiKey = process.env.INVICTUSPAY_API_KEY || 'sk_vvWrxA7wooqFINQwgow45WdZCFWWDVo9fnyVN9CfAUhaGp75b3pCBtrR';
    const baseUrl = (process.env.INVICTUSPAY_BASE_URL || 'https://api.invictuspayv2.com.br/api/v1').replace(/\/$/, '');

    const response = await fetch(`${baseUrl}/transactions/${encodeURIComponent(txId)}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return res.status(response.status || 502).json({
        success: false,
        paid: false,
        error: (result && (result.message || result.error)) || 'Transação não encontrada.'
      });
    }

    const tx = result.data;
    const isPaid = tx.status === 'paid';

    return res.status(200).json({
      success: true,
      id: tx.id,
      status: tx.status,
      paid: isPaid,
      amount: tx.amount ? tx.amount / 100 : null,
      currency: tx.currency || 'BRL',
      paid_at: tx.paid_at || null,
      created_at: tx.created_at || null
    });

  } catch (error) {
    console.error('[InvictusPay] Erro ao consultar transação:', error);
    return res.status(500).json({
      success: false,
      paid: false,
      error: 'Erro interno ao consultar status do Pix.',
      message: error.message
    });
  }
}
