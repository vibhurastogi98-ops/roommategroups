// Native Node.js --env-file loading is used (Node v20.6+)

import express from "express";
import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8787',
    'https://roommategroups.com',
    'https://www.roommategroups.com',
    /\.roommategroups\.com$/,
    /\.workers\.dev$/,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;


// Ensure uploads directory exists (absolute path)
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml']);

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`), false);
    }
  }
});

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/upload - New endpoint for image upload
app.post("/api/upload", (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: imageUrl,
      filename: req.file.filename,
    });
  });
});

// POST /api/send-email
app.post("/api/send-email", async (req, res) => {
  const { to, subject, html } = req.body;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai-assist - AI Description Generator
app.post("/api/ai-assist", async (req, res) => {
  console.log("[AI] Request received:", req.body.category, req.body.title);
  const { category, title, amenities, lifestyleTags, draft } = req.body;
  
  if (!genAI) {
    return res.status(500).json({ 
      success: false, 
      error: "GEMINI_API_KEY is not configured on the server. Please add it to your .env file." 
    });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { maxOutputTokens: 1000 }
    });
    
    const prompt = `
      You are an expert real estate and roommate matching copywriter. 
      Generate a compelling, friendly, and professional description for a listing with the following details:
      - Listing Category: ${category || 'Room for Rent'}
      - Title: ${title || 'Available Space'}
      - Amenities: ${(amenities || []).join(', ')}
      - Lifestyle/Preferences: ${(lifestyleTags || []).join(', ')}
      - Additional context: ${JSON.stringify(draft || {})}
      
      The description should be between 100 and 300 words. 
      Focus on making it sound attractive to potential roommates or tenants.
      Include information about the atmosphere, neighborhood perks, and house rules if applicable.
      Format it with clean paragraphs. Do not use markdown headers, just plain text with newlines.
      Respond ONLY with the description text.
    `;

    const result = await model.generateContent(prompt);
    if (!result.response) throw new Error('No response from AI model');
    const text = result.response.text();
    
    if (!text) throw new Error('AI generated an empty response');
    
    res.json({ success: true, text: text.trim() });
  } catch (err) {
    console.error("AI Assist error:", err);
    res.status(500).json({ success: false, error: err.message || "AI Generation failed" });
  }
});

const PORT = 3002;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
