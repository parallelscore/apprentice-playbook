const axios = require('axios');

async function syncDatabase() {

  try {

    console.log('\n=== SYNCING DATABASES ===\n');

    const response = await axios.post(
      'http://localhost:3000/sync-to-second-db'
    );

    console.log('SUCCESS');
    console.log(response.data);

  } catch (error) {

    console.log('ERROR');

    if (error.response) {

      console.log(error.response.data);

    } else {

      console.log(error.message);
    }
  }
}

syncDatabase();