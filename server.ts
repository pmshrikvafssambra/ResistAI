
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import fs from 'fs';
import { exec, spawn } from 'child_process';
import { loadTabularData, loadCardData, loadLocationData } from "./src/lib/data_processing";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route: Get Tabular Data
  app.get("/api/data", (req, res) => {
    try {
      const data = loadTabularData();
      res.json(data);
    } catch (error) {
      console.error("Error loading tabular data:", error);
      res.status(500).json({ error: "Failed to load tabular data" });
    }
  });

  // API Route: Get CARD Data
  app.get("/api/card", (req, res) => {
    try {
      const priors = loadCardData();
      res.json(priors);
    } catch (error) {
      console.error("Error loading CARD data:", error);
      res.status(500).json({ error: "Failed to load CARD data" });
    }
  });

  // API Route: Get Location Data
  app.get("/api/location", (req, res) => {
    try {
      const data = loadLocationData();
      res.json(data);
    } catch (error) {
      console.error("Error loading location data:", error);
      res.status(500).json({ error: "Failed to load location data" });
    }
  });

  // API Route: Train Model
  app.post("/api/train", (req, res) => {
    console.log("Starting model training...");
    exec("python3 train_model.py", (error, stdout, stderr) => {
      if (error) {
        console.error(`Training error: ${error.message}`);
        return res.status(500).json({ error: "Training failed", details: stderr });
      }
      console.log(`Training output: ${stdout}`);
      res.json({ message: "Training complete", output: stdout });
    });
  });

  // API Route: Get Metrics
  app.get("/api/metrics", (req, res) => {
    try {
      const metricsPath = path.join(process.cwd(), 'models', 'metrics.json');
      const insightsPath = path.join(process.cwd(), 'models', 'insights.json');
      
      if (!fs.existsSync(metricsPath)) {
        return res.status(404).json({ error: "Metrics not found. Please train the model first." });
      }
      
      const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
      const insights = fs.existsSync(insightsPath) ? JSON.parse(fs.readFileSync(insightsPath, 'utf8')) : {};
      
      res.json({ metrics, insights });
    } catch (error) {
      console.error("Error loading metrics:", error);
      res.status(500).json({ error: "Failed to load metrics" });
    }
  });

  // API Route: Predict
  app.post("/api/predict", (req, res) => {
    const inputData = req.body;
    
    const pythonProcess = spawn('python3', ['predict.py']);
    let result = '';
    let error = '';

    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Prediction process exited with code ${code}: ${error}`);
        return res.status(500).json({ error: "Prediction failed", details: error });
      }
      try {
        const prediction = JSON.parse(result);
        res.json(prediction);
      } catch (e) {
        console.error("Failed to parse prediction result:", result);
        res.status(500).json({ error: "Failed to parse prediction result", raw: result });
      }
    });
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
