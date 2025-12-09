const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const db = client.db('clubsphere');
    const usersCollection = db.collection('users');

    await client.connect();

    // All apis endpoint
    app.post('/users', async (req, res) => {
      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);

      if (!existingUser) {
        const result = await usersCollection.insertOne(req.body);
        return res.send(result);
      }

      res.send('This email is already registered. Please login instead.');
    });

    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// Express Js
app.get('/', (req, res) => {
  res.send('Server is running...');
});

app.listen(port, () => {
  console.log(`ClubSphere app listening on port ${port}`);
});
