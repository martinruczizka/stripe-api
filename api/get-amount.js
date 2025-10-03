const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // API-Token prüfen
  if (req.query.api_token !== 'mysecret123') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const sessionId = req.query.session_id;

    let session;
    try {
      // Erster Versuch mit expand
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });
    } catch (expandErr) {
      console.warn("⚠️ line_items konnte nicht geladen werden, fallback wird verwendet");
      session = await stripe.checkout.sessions.retrieve(sessionId);
    }

    const lineItems = session.line_items?.data || [];

    res.status(200).json({
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || '',
      orderId: session.id,
      products: lineItems.map(item => ({
        name: item.description,
        price: (item.amount_total || 0) / 100,
        quantity: item.quantity || 0,
      })),
    });
  } catch (err) {
    // ❗ Vollständiges Logging in Vercel
    console.error("❌ FEHLER IN SERVERLESS FUNCTION:", err);

    // ❗ Antwort mit Details für Debug-Zwecke
    res.status(500).json({
      error: err.message || 'Unbekannter Fehler',
      details: err,
    });
  }
}
