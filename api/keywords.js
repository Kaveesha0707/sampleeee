require("dotenv").config();
const mongoose = require("mongoose");

let isConnected = false;

// MongoDB connection logic
const connectToDatabase = async () => {
  if (isConnected) return;

  const MONGO_URI = process.env.MONGO_URI; 
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Database connection failed");
  }
};

// Define Schema and Model
const keywordSchema = new mongoose.Schema({
  text: { type: String, required: true },
  alertCount: { type: Number, default: 0 },
});

const Keyword = mongoose.model("Keyword", keywordSchema);

// Serverless function to handle API requests
module.exports = async (req, res) => {
  // Ensure database connection
  await connectToDatabase();

  if (req.method === "GET") {
    // GET /api/keywords
    try {
      const keywords = await Keyword.find();
      res.status(200).json(keywords);
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else if (req.method === "POST") {
    // POST /api/keywords
    const { text } = req.body;

    if (!text) {
      return res.status(400).send("Keyword text is required.");
    }

    try {
      const existingKeyword = await Keyword.findOne({ text });
      if (existingKeyword) {
        return res.status(400).send("Keyword already exists.");
      }

      const newKeyword = new Keyword({ text });
      await newKeyword.save();
      res.status(201).json(newKeyword);
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/keywords/:id
    const { id } = req.query;

    try {
      await Keyword.findByIdAndDelete(id);
      res.status(204).send();
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    // Method Not Allowed
    res.status(405).send("Method Not Allowed");
  }
};
