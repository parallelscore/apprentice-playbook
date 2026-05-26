const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {

  return new Promise((resolve) => {

    rl.question(question, resolve);

  });
}

async function addOrder() {

  try {

    console.log('\n=== ADD NEW ORDER ===\n');

    const external_id = await ask(
      'Enter External ID: '
    );

    const customer_name = await ask(
      'Enter Customer Name: '
    );

    const amount = await ask(
      'Enter Amount: '
    );

    const status = await ask(
      'Enter Status (pending/completed/failed): '
    );

    const response = await axios.post(
      'http://localhost:3000/add-order',
      {
        external_id,
        customer_name,
        amount,
        status
      }
    );

    console.log('\nSUCCESS');
    console.log(response.data);

  } catch (error) {

    console.log('\nERROR');

    if (error.response) {

      console.log(error.response.data);

    } else {

      console.log(error.message);
    }

  } finally {

    rl.close();
  }
}

addOrder();