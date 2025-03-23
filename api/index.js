require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const IITM_API_URL = "https://aiproxy.sanand.workers.dev/openai/v1/chat/completions";
const AI_PROXY_TOKEN = process.env.AI_PROXY_TOKEN;

if (!AI_PROXY_TOKEN) {
  console.error("❌ AI_PROXY_TOKEN is missing. Check Vercel environment variables.");
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Handle incoming requests
app.post("/api", upload.single("file"), async (req, res) => {
  try {
    const question = req.body.question;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    let fileData = "";
    if (req.file) {
      fileData = req.file.buffer.toString("utf-8");
    }

    // ✅ Increase timeout to 30s
    const response = await axios.post(IITM_API_URL, {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: `${question}\nFile data: ${fileData}` }],
    }, {
      headers: { "Authorization": `Bearer ${AI_PROXY_TOKEN}`, "Content-Type": "application/json" },
      timeout: 30000, // Increased timeout to 30 seconds
    });

    return res.json({ answer: response.data.choices[0].message.content });

  } catch (error) {
    console.error("❌ AI Fetch Error:", error.message);
    return res.status(500).json({ error: "Failed to fetch AI response due to timeout." });
  }
});

module.exports = app;
