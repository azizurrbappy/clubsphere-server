const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const clubsCollection = db.collection('clubs');

    await client.connect();

    // All user apis endpoint
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
          projection: { _id: 0, email: 1, providerId: 1 },
        };

        const result = await usersCollection.findOne(query, options);
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.get('/users/:email/role', async (req, res) => {
      const { email } = req.params;
      const query = { email: email };

      const user = await usersCollection.findOne(query);
      res.send({ role: user?.role || 'userRole' });
    });

    app.get('/users', async (req, res) => {
      try {
        const cursor = usersCollection.find();
        const allValues = await cursor.toArray();

        res.send(allValues);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.patch('/user', async (req, res) => {
      try {
        const { role, id } = req.query;

        const query = { _id: new ObjectId(id) };
        const update = { $set: { role: role } };
        const options = {};
        const result = await usersCollection.updateOne(query, update, options);
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Admin Dashboard Stats
    app.get('/admin-dash', async (req, res) => {
      try {
        const totalUsers = await usersCollection.countDocuments();

        res.send({
          totalUsers: totalUsers || 0,
          totalMemberships: 0,
          totalEvents: 0,
          totalPaymentsAmount: 0,
        });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Club Manger
    app.post('/club', async (req, res) => {
      try {
        const result = await clubsCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.get('/clubs', async (req, res) => {
      try {
        const { managerEmail } = req.query;
        const query = { managerEmail: managerEmail };

        const cursor = clubsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.patch('/club', async (req, res) => {
      try {
        const { id } = req.query;
        const clubData = req.body;

        const query = { _id: new ObjectId(id) };
        const updateDocument = {
          $set: clubData,
        };

        const result = await clubsCollection.updateOne(query, updateDocument);
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    app.delete('/club', async (req, res) => {
      try {
        const { id } = req.query;
        const query = { _id: new ObjectId(id) };

        const result = await clubsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    //////////////////////////////////////////////
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
