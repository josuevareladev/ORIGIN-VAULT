const { pool } = require('../config/db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    const orderQuery = `
      INSERT INTO orders (user_id, total, status)
      VALUES ($1, $2, 'pending')
      RETURNING id;
    `;
    const orderResult = await client.query(orderQuery, [userId, calculatedTotal]);
    const orderId = orderResult.rows[0].id;

    for (const orderItem of orderItemsData) {
      await client.query(`
        INSERT INTO order_items (order_id, inventory_id, quantity, price_at_purchase)
        VALUES ($1, $2, $3, $4)
      `, [orderId, orderItem.inventory_id, orderItem.quantity, orderItem.price]);
    }

    await client.query('COMMIT'); 

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
      data: { url: paymentUrl }
    });

  } catch (error) {
    await client.query('ROLLBACK'); 
    next(error);
  } finally {
    client.release(); 
  }
};

const finalizeOrder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { order_id } = req.body;
    
    if (!order_id) {
      const error = new Error('Missing order reference.');
      error.statusCode = 400;
      throw error;
    }

    await client.query('BEGIN');

    // Bloqueamos la fila de la orden para evitar condiciones de carrera
    const orderRes = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [order_id]);
    
    if (orderRes.rowCount === 0) {
      const error = new Error('Order not found in the vault.');
      error.statusCode = 404;
      throw error;
    }

    if (orderRes.rows[0].status === 'completed') {
      await client.query('ROLLBACK');
      return res.status(200).json({ status: 'success', message: 'Transaction already sealed.' });
    }

    // Cambiar estado de la orden
    await client.query("UPDATE orders SET status = 'completed' WHERE id = $1", [order_id]);

    // Extraer items y descontar stock real de la bóveda
    const itemsRes = await client.query('SELECT inventory_id, quantity FROM order_items WHERE order_id = $1', [order_id]);
    
    for (const item of itemsRes.rows) {
      await client.query(
        'UPDATE inventory SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.inventory_id]
      );
    }

    await client.query('COMMIT');
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Transaction successfully sealed and stock deducted.' 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  processCheckout,
  finalizeOrder
};