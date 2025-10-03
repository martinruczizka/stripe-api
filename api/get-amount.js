const Stripe = require('stripe');

const stripe = Stripe(
  process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY
);

export default async function handler(req, res) {
  // CORS-Header hinzufügen
  res.setHeader("Access-Control-Allow-Origin", "https://www.institut-sitya.at");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight-Request abfangen
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // API-Token prüfen
  if (req.query.api_token !== process.env.API_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
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
      customer_email: session.customer_details?.email || '',
      payment_status: session.payment_status || '',
      products: lineItems.map(item => ({
        name: item.description,
        price: (item.amount_total || 0) / 100,
        quantity: item.quantity || 0,
      })),
    });
  } catch (err) {
    console.error("❌ FEHLER IN SERVERLESS FUNCTION:", err);
    res.status(500).json({
      error: err.message || 'Unbekannter Fehler',
    });
  }
}
