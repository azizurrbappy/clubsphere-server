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
      try {
        const email = req.body.email;
        const { providerId } = req.query;
        console.log(providerId);

        // Check if user already exists
        const query = { email: email };
        const existingUser = await usersCollection.findOne(query);

        if (providerId && existingUser) {
          return res.status(409).json({
            error: 'This email is already registered. Please login instead.',
          });
        }

        if (existingUser) {
          return res.send(
            'This email is already registered. Please login instead.'
          );
        }

        // Insert new user
        const result = await usersCollection.insertOne(req.body);
        return res.status(201).json(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.get('/user', async (req, res) => {
      try {
        const { email } = req.query;
        const query = { email: email };

        const options = {
          projection: { _id: 0, email: 1 },
        };

        const result = await usersCollection.findOne(query, options);
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
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
