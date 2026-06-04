const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { pool } = require('../config/db');

const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    // 1. Verificación Criptográfica
    // OJO: req.body aquí DEBE ser un Buffer en crudo, no un objeto JSON.
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`[Security Error] Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Procesamiento del Evento de Negocio
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Recuperamos el ID de la orden que inyectamos en el checkout dual
    const orderId = session.client_reference_id;

    if (orderId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Bloqueamos la fila preventivamente
        const orderRes = await client.query('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
        
        // Solo actuamos si la orden existe y sigue pendiente
        if (orderRes.rowCount > 0 && orderRes.rows[0].status === 'pending') {
          
          await client.query("UPDATE orders SET status = 'completed' WHERE id = $1", [orderId]);
          
          // Descuento estricto de inventario
          const itemsRes = await client.query('SELECT inventory_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
          
          for (const item of itemsRes.rows) {
            await client.query(
              'UPDATE inventory SET stock = stock - $1 WHERE id = $2', 
              [item.quantity, item.inventory_id]
            );
          }
          
          console.log(`[System Audit] Order ${orderId} successfully sealed via Webhook.`);
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[DB Error] Webhook failed to update order ${orderId}: ${error.message}`);
        // NOTA SENIOR: No lanzamos un throw/next(error) aquí.
        // Si fallamos internamente, igual debemos devolver 200 a Stripe, 
        // de lo contrario, Stripe intentará reenviar el evento de forma agresiva por 3 días.
      } finally {
        client.release();
      }
    }
  }

  // 3. Confirmación de Recepción Obligatoria
  res.status(200).json({ received: true });
};

module.exports = {
  handleStripeWebhook
};