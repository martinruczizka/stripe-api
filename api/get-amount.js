const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.query.api_token !== 'mysecret123') { // Ersetze mit deinem Token
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    const sessionId = req.query.session_id;
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });
    res.status(200).json({
      amount: session.amount_total / 100,
      currency: session.currency,
      orderId: session.id,
      products: session.line_items.data.map(item => ({
        name: item.description,
        price: item.amount_total / 100,
        quantity: item.quantity,
      })),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
