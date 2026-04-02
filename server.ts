import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { exec } from "child_process";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route: Antibiotic Resistance Prediction (Real ML Inference)
  app.post("/api/predict", async (req, res) => {
    const { 
      bacteria, antibiotic, dosage, 
      age = 45, sex = 'M', exposure = 5, 
      ward = 'General', comorbidity = 2, 
      ndm1 = 0, mcr1 = 0 
    } = req.body;

    // Call the Python inference bridge (src/predict.py)
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    const runInference = () => {
      return new Promise((resolve, reject) => {
        const cmd = `${pythonCmd} src/predict.py --bacteria "${bacteria}" --antibiotic "${antibiotic}" --dosage ${dosage} --age ${age} --sex "${sex}" --exposure ${exposure} --ward "${ward}" --comorbidity ${comorbidity} --ndm1 ${ndm1} --mcr1 ${mcr1}`;
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            console.error(`Inference Error: ${stderr}`);
            reject(stderr);
            return;
          }
          try {
            // The output of predict.py is now a formatted string for CLI, 
            // but the JSON is still needed for the API.
            // Let's modify predict.py to output JSON if requested, or just parse the last line if it's JSON.
            // Actually, I'll just parse the JSON from the stdout which I'll ensure is there.
            const lines = stdout.trim().split('\n');
            const jsonStr = lines.find(l => l.startsWith('{') && l.endsWith('}'));
            if (jsonStr) {
              resolve(JSON.parse(jsonStr));
            } else {
              // Fallback: if we can't find JSON, we'll try to parse the whole thing
              resolve(JSON.parse(stdout));
            }
          } catch (e) {
            reject("Failed to parse model output");
          }
        });
      });
    };

    let prediction = "Susceptible";
    let probability = 0.94;
    let mdrRiskScore = 15;
    let explanation = "The simulated model identified potential susceptibility based on standard clinical guidelines.";
    let recommendation = "Continue monitoring.";
    let realModelUsed = false;

    try {
      const result: any = await runInference();
      if (result.status === "success") {
        prediction = result.prediction;
        probability = result.probability;
        mdrRiskScore = result.mdrRiskScore;
        explanation = result.explanation;
        recommendation = result.recommendation;
        realModelUsed = true;
      } else {
        console.warn("Model inference failed, falling back to simulation:", result.error);
      }
    } catch (error) {
      console.warn("Python bridge failed, falling back to simulation:", error);
    }

    res.json({
      prediction,
      probability,
      explanation,
      recommendation,
      mdrRiskScore,
      realModelUsed
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
