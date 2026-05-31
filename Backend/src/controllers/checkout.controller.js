const { pool } = require('../config/db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helper function to authenticate securely with PayPal REST API
const generatePayPalAccessToken = async () => {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const response = await fetch(`${process.env.PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate PayPal access token.');
  }
  
  const data = await response.json();
  return data.access_token;
};

const processCheckout = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { items, payment_gateway } = req.body; 
    const userId = req.user.userId; 

    // Strict validation
    if (!items || items.length === 0) {
      const error = new Error('Cannot process an empty ledger.');
      error.statusCode = 400;
      throw error;
    }

    if (!['stripe', 'paypal'].includes(payment_gateway)) {
      const error = new Error('Invalid payment gateway selected.');
      error.statusCode = 400;
      throw error;
    }

    await client.query('BEGIN'); 

    let calculatedTotal = 0;
    const orderItemsData = [];
    const stripeLineItems = [];

    // 1. ACID Stock Validation and Price Calculation
    for (const item of items) {
      const stockQuery = 'SELECT c.name, i.stock, i.price, i.condition, i.language FROM inventory i JOIN cards c ON i.card_id = c.id WHERE i.id = $1 FOR UPDATE'; 
      const stockResult = await client.query(stockQuery, [item.inventory_id]);

      if (stockResult.rowCount === 0) {
        throw new Error(`Asset ${item.inventory_id} no longer exists in the vault.`);
      }

      const dbItem = stockResult.rows[0];

      if (dbItem.stock < item.quantity) {
        const error = new Error(`Insufficient stock for: ${dbItem.name}.`);
        error.statusCode = 409;
        throw error;
      }

      calculatedTotal += (dbItem.price * item.quantity);
      
      orderItemsData.push({
        inventory_id: item.inventory_id,
        quantity: item.quantity,
        price: dbItem.price
      });

      if (payment_gateway === 'stripe') {
        stripeLineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${dbItem.name} (${dbItem.condition})`,
              description: `Language: ${dbItem.language}`,
            },
            unit_amount: Math.round(dbItem.price * 100), 
          },
          quantity: item.quantity,
        });
      }
    }

    // 2. Generate the Master Order Record (Status: pending)
    const orderQuery = `
      INSERT INTO orders (user_id, total, status)
      VALUES ($1, $2, 'pending')
      RETURNING id;
    `;
    const orderResult = await client.query(orderQuery, [userId, calculatedTotal]);
    const orderId = orderResult.rows[0].id;

    // 3. Record Line Items
    for (const orderItem of orderItemsData) {
      await client.query(`
        INSERT INTO order_items (order_id, inventory_id, quantity, price_at_purchase)
        VALUES ($1, $2, $3, $4)
      `, [orderId, orderItem.inventory_id, orderItem.quantity, orderItem.price]);
    }

    // Commit database changes BEFORE calling external APIs to ensure our DB state is stable
    await client.query('COMMIT'); 

    // 4. Financial Gateway Routing
    let paymentUrl = '';

    if (payment_gateway === 'stripe') {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: stripeLineItems,
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${process.env.CLIENT_URL}/`,
        client_reference_id: orderId,
        metadata: { userId: userId }
      });
      paymentUrl = session.url;

    } else if (payment_gateway === 'paypal') {
      const accessToken = await generatePayPalAccessToken();
      const paypalOrderResponse = await fetch(`${process.env.PAYPAL_API_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: orderId,
            amount: {
              currency_code: 'USD',
              value: calculatedTotal.toFixed(2)
            }
          }],
          payment_source: {
            paypal: {
              experience_context: {
                payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                brand_name: 'Origin Vault',
                user_action: 'PAY_NOW',
                return_url: `${process.env.CLIENT_URL}/checkout/success?order_id=${orderId}`,
                cancel_url: `${process.env.CLIENT_URL}/`
              }
            }
          }
        })
      });

      if (!paypalOrderResponse.ok) {
        throw new Error('Failed to initialize PayPal transaction.');
      }

      const paypalOrder = await paypalOrderResponse.json();
      const approveLink = paypalOrder.links.find(link => link.rel === 'payer-action' || link.rel === 'approve');
      paymentUrl = approveLink.href;
    }

    res.status(200).json({
      status: 'success',
      message: 'Checkout session successfully generated.',
      data: { url: paymentUrl }
    });

  } catch (error) {
    await client.query('ROLLBACK'); 
    next(error);
  } finally {
    client.release(); 
  }
};

module.exports = {
  processCheckout
};