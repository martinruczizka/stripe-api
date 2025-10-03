const Stripe = require('stripe');

// Automatischer Fallback: live → test
const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY
);

export default async function handler(req, res) {
  // Sichere Token-Prüfung über Umgebungsvariable
  if (req.query.api_token !== process.env.API_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const sessionId = req.query.session_id;

    // Session inkl. Produkte abrufen
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

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
    // Fehlerlogging für Debug
    console.error("❌ FEHLER IN SERVERLESS FUNCTION:", err);

    res.status(500).json({
      error: err.message || 'Unbekannter Fehler',
    });
  }
}
