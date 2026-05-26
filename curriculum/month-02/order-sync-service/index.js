const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/*
====================================
DATABASE 1 CONNECTION
====================================
*/

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '2846',
  database: 'order_service'
});

/*
====================================
DATABASE 2 CONNECTION
====================================
*/

const secondPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '2846',
  database: 'order_service_2'
});

/*
====================================
HOME ROUTE
====================================
*/

app.get('/', (req, res) => {

  res.send('Order Sync Service Running');

});

/*
====================================
GET ALL ORDERS
====================================
*/

app.get('/orders', async (req, res) => {

  try {

    const [rows] = await pool.query(
      'SELECT * FROM orders'
    );

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Failed to fetch orders'
    });
  }
});

/*
====================================
GET SYNC RUNS
====================================
*/

app.get('/sync-runs', async (req, res) => {

  try {

    const [rows] = await pool.query(
      'SELECT * FROM sync_runs'
    );

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Failed to fetch sync runs'
    });
  }
});

/*
====================================
MANUALLY ADD ORDER
====================================
*/

app.post('/add-order', async (req, res) => {

  try {

    const {
      external_id,
      customer_name,
      amount,
      status
    } = req.body;

    const [result] = await pool.query(
      `
      INSERT INTO orders(
        external_id,
        customer_name,
        amount,
        status
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        external_id,
        customer_name,
        amount,
        status
      ]
    );

    res.json({
      message: 'Order added successfully',
      orderId: result.insertId
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Failed to add order'
    });
  }
});

/*
====================================
SYNC FAKE EXTERNAL ORDERS
====================================
*/

app.post('/sync-orders', async (req, res) => {

  try {

    /*
    CREATE SYNC RUN
    */

    const [syncRun] = await pool.query(
      `
      INSERT INTO sync_runs(status)
      VALUES('running')
      `
    );

    const syncRunId = syncRun.insertId;

    /*
    SIMULATED EXTERNAL API DATA
    */

    const fakeOrders = [
      {
        external_id: 'ORD-2001',
        customer_name: 'Alice Johnson',
        amount: 150,
        status: 'completed'
      },
      {
        external_id: 'ORD-2002',
        customer_name: 'David Brown',
        amount: 75,
        status: 'pending'
      }
    ];

    /*
    INSERT ORDERS
    */

    for (const order of fakeOrders) {

      await pool.query(
        `
        INSERT IGNORE INTO orders(
          external_id,
          customer_name,
          amount,
          status,
          sync_run_id
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          order.external_id,
          order.customer_name,
          order.amount,
          order.status,
          syncRunId
        ]
      );
    }

    /*
    UPDATE SYNC STATUS
    */

    await pool.query(
      `
      UPDATE sync_runs
      SET
        status = 'success',
        finished_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [syncRunId]
    );

    res.json({
      message: 'Orders synced successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Sync failed'
    });
  }
});

/*
====================================
SYNC DATABASE 1 TO DATABASE 2
====================================
*/

app.post('/sync-to-second-db', async (req, res) => {

  try {

    /*
    GET ALL ORDERS FROM DATABASE 1
    */

    const [orders] = await pool.query(
      'SELECT * FROM orders'
    );

    /*
    INSERT INTO DATABASE 2
    */

    for (const order of orders) {

      await secondPool.query(
        `
        INSERT IGNORE INTO orders(
          external_id,
          customer_name,
          amount,
          status,
          sync_run_id
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          order.external_id,
          order.customer_name,
          order.amount,
          order.status,
          order.sync_run_id
        ]
      );
    }

    res.json({
      message: 'Data synced to second database successfully'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Database sync failed'
    });
  }
});

/*
====================================
GET ORDERS FROM SECOND DATABASE
====================================
*/

app.get('/orders-db2', async (req, res) => {

  try {

    const [rows] = await secondPool.query(
      'SELECT * FROM orders'
    );

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Failed to fetch second database orders'
    });
  }
});

/*
====================================
START SERVER
====================================
*/

app.listen(3000, () => {

  console.log(
    'Server running on http://localhost:3000'
  );

});