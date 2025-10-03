const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // API‑Token prüfen
  if (req.query.api_token !== 'mysecret123') { // Ersetze mit deinem eigenen Token
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const sessionId = req.query.session_id;

    // Session holen (mit Expand)
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });
    } catch (expandErr) {
      // Fallback: Session ohne Expand holen
      session = await stripe.checkout.sessions.retrieve(sessionId);
    }

    // line_items ggf. leer initialisieren
    const lineItems = session.line_items?.data || [];

    // JSON‑Antwort
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
    // Fehler sauber zurückgeben
    res.status(400).json({ error: err.message });
  }
}
