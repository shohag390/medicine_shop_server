const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// MongoDB connection string
const url = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@medicineshop.odna6cz.mongodb.net/?retryWrites=true&w=majority&appName=medicineshop`;

const client = new MongoClient(url, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});


async function run() {
    try {
        // await client.connect();

        // Collections
        const db = client.db("medical_shop");
        const usersCollection = db.collection('users');
        const medicinesCollection = db.collection('medicines');

        // Root
        app.get("/", (req, res) => {
            res.send("Medical Shop API Running");
        });

        // Create User 
        app.post('/users', async (req, res) => {
            const email = req.body.email;
            const userExists = await usersCollection.findOne({ email })
            if (userExists) {
                // update last log in
                return res.status(200).send({ message: 'User already exists', inserted: false });
            }
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })




        // ✅ Add new medicine
        app.post("/medicines", async (req, res) => {
            try {
                const medicine = req.body;
                const result = await medicinesCollection.insertOne(medicine);
                res.status(201).send({ success: true, message: "Medicine added", result });
            } catch (err) {
                res.status(500).send({ success: false, error: err.message });
            }
        });

        // ✅ Get all medicines (with optional email filter)
        app.get("/medicines", async (req, res) => {
            try {
                const email = req.query.email;
                let query = {};
                if (email) {
                    query = { created_by: email }; // fetch only medicines created by this user
                }
                const result = await medicinesCollection.find(query).toArray();
                res.send(result);
            } catch (err) {
                res.status(500).send({ success: false, error: err.message });
            }
        });

        // ✅ Get single medicine by ID
        app.get("/medicines/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const result = await medicinesCollection.findOne({ _id: new ObjectId(id) });
                if (!result) {
                    return res.status(404).send({ success: false, message: "Medicine not found" });
                }
                res.send(result);
            } catch (err) {
                res.status(500).send({ success: false, error: err.message });
            }
        });

        // ✅ Update medicine by ID
        app.patch("/medicines/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updatedData = req.body;
                const result = await medicinesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedData }
                );
                if (result.matchedCount === 0) {
                    return res.status(404).send({ success: false, message: "Medicine not found" });
                }
                res.send({ success: true, message: "Medicine updated", result });
            } catch (err) {
                res.status(500).send({ success: false, error: err.message });
            }
        });

        // ✅ Delete medicine by ID
        app.delete("/medicines/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const result = await medicinesCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) {
                    return res.status(404).send({ success: false, message: "Medicine not found" });
                }
                res.send({ success: true, message: "Medicine deleted", result });
            } catch (err) {
                res.status(500).send({ success: false, error: err.message });
            }
        });

        console.log("Connected to MongoDB successfully");
    } catch (err) {
        console.error(err);
    }
}
run().catch(console.dir);

// Run server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
