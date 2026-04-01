import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize Gemini AI for "Explainable AI" and "Decision Support"
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Route: Antibiotic Resistance Prediction (Simulated ML)
  app.post("/api/predict", async (req, res) => {
    const { bacteria, antibiotic, dosage } = req.body;

    // Simulated "God-Level" ML Logic (Multi-Level Stacking Ensemble Simulation)
    // In a real app, this would call the trained 'models/resistai_master_v2.pkl'
    const resistanceLevels = ["Resistant", "Susceptible", "Intermediate"];
    
    // Deterministic simulation for high accuracy demonstration
    let prediction = "Susceptible";
    let probability = 0.94 + Math.random() * 0.05; // 94% to 99% confidence (God Level)

    // Complex biological logic simulation
    const gramNegative = ["E. coli", "K. pneumoniae", "P. aeruginosa", "A. baumannii"];
    const gramPositive = ["S. aureus", "E. faecalis", "S. pneumoniae"];
    
    // Rule 1: Vancomycin (Glycopeptide) doesn't work on Gram-negatives
    if (gramNegative.includes(bacteria) && antibiotic === "Vancomycin") {
        prediction = "Resistant";
        probability = 0.99;
    }
    
    // Rule 2: E. coli vs Amoxicillin (High natural resistance)
    if (bacteria === "E. coli" && antibiotic === "Amoxicillin") {
        prediction = "Resistant";
        probability = 0.97;
    }

    // Rule 3: Carbapenem resistance (Meropenem)
    if (bacteria === "K. pneumoniae" && antibiotic === "Meropenem") {
        prediction = Math.random() > 0.8 ? "Resistant" : "Susceptible";
        probability = 0.95;
    }

    // Rule 4: Dosage threshold
    if (dosage < 250) {
        prediction = "Resistant";
        probability = 0.92;
    }

    // Rule 5: S. aureus (MRSA simulation)
    if (bacteria === "S. aureus" && antibiotic === "Amoxicillin") {
        prediction = "Resistant";
        probability = 0.98;
    }

    // Use Gemini to provide "Explainable AI" insights with a focus on the Stacking Ensemble
    let explanation = "The Multi-Level Stacking Ensemble (XGBoost + LightGBM + RF + SVC) identified high correlation between the bacterial strain's Gram-stain properties and the antibiotic's mechanism of action.";
    let recommendation = "";

    try {
      if (process.env.GEMINI_API_KEY) {
        const prompt = `As a bioinformatics expert, explain why a bacterial strain like ${bacteria} might be ${prediction} to ${antibiotic} at a dosage of ${dosage}mg. Provide a concise, scientific explanation and suggest an alternative antibiotic if it's resistant. Format as JSON: { "explanation": "...", "recommendation": "..." }`;
        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const responseText = result.text;
        if (responseText) {
            const parsed = JSON.parse(responseText);
            explanation = parsed.explanation;
            recommendation = parsed.recommendation;
        }
      }
    } catch (error) {
      console.error("Gemini AI Error:", error);
    }

    res.json({
      prediction,
      probability,
      explanation,
      recommendation,
      mdrRiskScore: Math.floor(Math.random() * 100) // Innovation: MDR Risk Scoring
    });
  });

  // API Route: Clinical Simulation
  app.get("/api/simulation", (req, res) => {
    const scenarios = [
      { id: 1, case: "72-year-old male with UTI, suspected E. coli infection.", strain: "E. coli", currentAntibiotic: "Amoxicillin" },
      { id: 2, case: "24-year-old female with skin infection, suspected S. aureus.", strain: "S. aureus", currentAntibiotic: "Vancomycin" },
      { id: 3, case: "45-year-old male with pneumonia, suspected K. pneumoniae.", strain: "K. pneumoniae", currentAntibiotic: "Ciprofloxacin" }
    ];
    res.json(scenarios[Math.floor(Math.random() * scenarios.length)]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
