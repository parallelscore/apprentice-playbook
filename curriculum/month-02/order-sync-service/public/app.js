async function loadOrders() {

  const response =
    await fetch('http://localhost:3000/orders');

  const data = await response.json();

  const table =
    document.getElementById('ordersTable');

  table.innerHTML = '';

  data.forEach(order => {

    table.innerHTML += `
      <tr>
        <td>${order.id}</td>
        <td>${order.external_id}</td>
        <td>${order.customer_name}</td>
        <td>${order.amount}</td>
        <td>${order.status}</td>
      </tr>
    `;
  });
}

async function loadOrdersDb2() {

  const response =
    await fetch('http://localhost:3000/orders-db2');

  const data = await response.json();

  const table =
    document.getElementById('ordersTable2');

  table.innerHTML = '';

  data.forEach(order => {

    table.innerHTML += `
      <tr>
        <td>${order.id}</td>
        <td>${order.external_id}</td>
        <td>${order.customer_name}</td>
        <td>${order.amount}</td>
        <td>${order.status}</td>
      </tr>
    `;
  });
}

function showTab(tab) {

  document.getElementById('db1').style.display =
    tab === 'db1' ? 'block' : 'none';

  document.getElementById('db2').style.display =
    tab === 'db2' ? 'block' : 'none';
}

function openModal() {

  document.getElementById('modal').style.display =
    'block';
}

function closeModal() {

  document.getElementById('modal').style.display =
    'none';
}

async function addOrder() {

  const external_id =
    document.getElementById('external_id').value;

  const customer_name =
    document.getElementById('customer_name').value;

  const amount =
    document.getElementById('amount').value;

  const status =
    document.getElementById('status').value;

  await fetch(
    'http://localhost:3000/add-order',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        external_id,
        customer_name,
        amount,
        status
      })
    }
  );

  closeModal();

  loadOrders();
}

async function syncDatabase() {

  await fetch(
    'http://localhost:3000/sync-to-second-db',
    {
      method: 'POST'
    }
  );

  loadOrdersDb2();
}

loadOrders();
loadOrdersDb2();