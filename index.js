const express = require("express");
const helmet = require("helmet");
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://vercel.live"], // Allow Vercel live reload scripts
        connectSrc: ["'self'", "https://vercel.live"], // Allow connections to Vercel for live reloads
        // Add other directives as needed
      },
    },
  })
);
app.use(cors());
app.use(express.json());

// mongodb code

const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const taskCollection = client.db("task-management").collection("allTask");

    // all Task Collection by user -->
    app.get("/allTask", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await taskCollection.find(query).sort({ _id: -1 }).toArray();
      res.send(result);
    });

    app.get("/allTask", async (req, res) => {
      const result = await taskCollection.find().sort({ _id: -1 }).toArray();
      res.send(result);
    });

    app.get("/allTask/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await taskCollection.findOne(filter);
      res.send(result);
    });

    app.post("/allTask", async (req, res) => {
      const task = req.body;
      const taskWithStatus = {
        ...task,
        status: "backlog"
      };
    
      try {
        const result = await taskCollection.insertOne(taskWithStatus);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to insert task" });
      }
    });
    
    app.patch("/allTask/:id", async (req, res) => {
      const id = req.params.id; 
      const { status } = req.body; 

      if (!status) {
        return res.status(400).send({ error: "Status is required" });
      }
    
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: status, 
        },
      };
    
      try {
        const result = await taskCollection.updateOne(filter, updateDoc);
        if (result.modifiedCount === 0) {
          return res.status(404).send({ error: "Task not found or already updated" });
        }
        res.send({ message: "Task status updated successfully" });
      } catch (error) {
        res.status(500).send({ error: "Failed to update task status" });
      }
    });
    

    app.put("/allTask/:id", async (req, res) => {
      const id = req.params.id;
      const editInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: editInfo.name,
          email: editInfo.email,
          title: editInfo.title,
          descriptions: editInfo.descriptions,
          date_form: editInfo.date_form,
          date_too: editInfo.date_too,
          priority: editInfo.priority,
        },
      };
      const result = await taskCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/allTask/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server is running at port: ${port}`);
});
