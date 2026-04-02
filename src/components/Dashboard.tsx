
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  ShieldAlert, 
  Microscope, 
  TrendingUp, 
  MapPin, 
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Search,
  BarChart3,
  BrainCircuit,
  FileText,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { ResistanceData, CardPrior } from '../lib/data_processing';

const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // S, I, R

interface PredictionResult {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
  status: string;
  features?: {
    gene_count: number;
    mutation_present: number;
  };
}

interface MetricsData {
  metrics: {
    accuracy: number;
    f1_macro: number;
    roc_auc: number | null;
    classification_report: any;
    confusion_matrix: number[][];
  };
  insights: {
    feature_importance: { feature: string; importance: number }[];
    top_bacteria_accuracy: Record<string, number>;
    difficult_classes: string[];
  };
}

export default function Dashboard() {
  const [data, setData] = useState<ResistanceData[]>([]);
  const [cardPriors, setCardPriors] = useState<CardPrior[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [training, setTraining] = useState(false);
  
  // Prediction state
  const [predBacteria, setPredBacteria] = useState('');
  const [predAntibiotic, setPredAntibiotic] = useState('');
  const [predAge, setPredAge] = useState(45);
  const [predGender, setPredGender] = useState('M');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resData, resCard, resLoc, resMetrics] = await Promise.all([
          fetch('/api/data').then(r => r.json()),
          fetch('/api/card').then(r => r.json()),
          fetch('/api/location').then(r => r.json()),
          fetch('/api/metrics').then(r => r.ok ? r.json() : null)
        ]);
        setData(resData);
        setCardPriors(resCard);
        setLocationData(resLoc);
        if (resMetrics) setMetricsData(resMetrics);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      const res = await fetch('/api/train', { method: 'POST' });
      if (res.ok) {
        const resMetrics = await fetch('/api/metrics').then(r => r.json());
        setMetricsData(resMetrics);
      }
    } catch (err) {
      console.error("Training error:", err);
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async () => {
    if (predBacteria && predAntibiotic) {
      setPredicting(true);
      try {
        const res = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bacteria: predBacteria,
            antibiotic: predAntibiotic,
            age: predAge,
            gender: predGender
          })
        });
        const result = await res.json();
        setPrediction(result);
      } catch (err) {
        console.error("Prediction error:", err);
      } finally {
        setPredicting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-slate-600 font-medium">Initializing biological datasets & ML backend...</p>
      </div>
    );
  }

  const bacteriaTypes = Array.from(new Set(data.map(d => d.bacteria)));
  const antibiotics = Array.from(new Set(data.map(d => d.antibiotic)));
  
  const statsByBacteria = bacteriaTypes.map(b => {
    const bData = data.filter(d => d.bacteria === b);
    return {
      name: b,
      R: bData.filter(d => d.status === 'R').length,
      I: bData.filter(d => d.status === 'I').length,
      S: bData.filter(d => d.status === 'S').length,
    };
  }).sort((a, b) => (b.R + b.I + b.S) - (a.R + a.I + a.S)).slice(0, 8);

  const radarData = metricsData ? Object.entries(metricsData.insights.top_bacteria_accuracy).map(([name, value]) => ({
    subject: name.split(' ').pop() || name,
    A: value * 100,
    fullMark: 100,
  })).slice(0, 6) : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-900">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <BrainCircuit className="text-primary w-8 h-8" />
            AMR Predictive Intelligence
          </h1>
          <p className="text-slate-500 mt-1">Advanced Gradient Boosting Pipeline with CARD Biological Priors.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium">{data.length.toLocaleString()} Samples</span>
          </div>
          <button 
            onClick={handleTrain}
            disabled={training}
            className={cn(
              "px-6 py-2 rounded-lg font-semibold shadow-sm transition-all flex items-center gap-2",
              training ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90"
            )}
          >
            {training ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {metricsData ? "Retrain Pipeline" : "Initialize ML"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stats Overview */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold">{metricsData ? (metricsData.metrics.accuracy * 100).toFixed(1) : '--'}%</div>
              <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${metricsData ? metricsData.metrics.accuracy * 100 : 0}%` }} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">F1-Score</span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{metricsData ? (metricsData.metrics.f1_macro * 100).toFixed(1) : '--'}%</div>
              <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${metricsData ? metricsData.metrics.f1_macro * 100 : 0}%` }} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROC-AUC</span>
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{metricsData?.metrics.roc_auc ? (metricsData.metrics.roc_auc * 100).toFixed(1) : '--'}%</div>
              <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${metricsData?.metrics.roc_auc ? metricsData.metrics.roc_auc * 100 : 0}%` }} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resistance</span>
                <ShieldAlert className="w-4 h-4 text-destructive" />
              </div>
              <div className="text-2xl font-bold">
                {((data.filter(d => d.status === 'R').length / data.length) * 100).toFixed(1)}%
              </div>
              <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                <div className="bg-destructive h-full" style={{ width: `${(data.filter(d => d.status === 'R').length / data.length) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Model Performance Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-wider text-slate-500">
                <BarChart3 className="w-4 h-4 text-primary" />
                Accuracy by Bacterial Species
              </h3>
              <div className="h-[250px] w-full">
                {metricsData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Accuracy"
                        dataKey="A"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                    Train model to view species-level performance
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-wider text-slate-500">
                <FileText className="w-4 h-4 text-primary" />
                Confusion Matrix (Normalized)
              </h3>
              {metricsData ? (
                <div className="grid grid-cols-3 gap-2 h-[200px]">
                  {metricsData.metrics.confusion_matrix.map((row, i) => (
                    row.map((val, j) => {
                      const rowSum = row.reduce((a, b) => a + b, 0);
                      const intensity = val / rowSum;
                      const labels = ['I', 'R', 'S'];
                      return (
                        <div 
                          key={`${i}-${j}`} 
                          className="relative flex items-center justify-center rounded-lg border border-slate-100 group"
                          style={{ backgroundColor: `rgba(59, 130, 246, ${intensity * 0.8 + 0.05})` }}
                        >
                          <span className={cn("font-bold text-sm", intensity > 0.5 ? "text-white" : "text-slate-700")}>
                            {val}
                          </span>
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            True: {labels[i]} | Pred: {labels[j]}
                          </div>
                        </div>
                      );
                    })
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-slate-400 text-sm italic">
                  Confusion matrix will appear after training
                </div>
              )}
              <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400">
                <span>Predicted: I, R, S</span>
                <span>Actual: I, R, S (Rows)</span>
              </div>
            </div>
          </div>

          {/* CARD Insights */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-slate-500">
              <Microscope className="w-4 h-4 text-primary" />
              Biological Context (CARD Database)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Organism</th>
                    <th className="px-4 py-3 font-semibold">Antibiotic</th>
                    <th className="px-4 py-3 font-semibold">Resistance Gene</th>
                    <th className="px-4 py-3 font-semibold">Mechanism</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cardPriors.slice(0, 5).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.bacteria}</td>
                      <td className="px-4 py-3">{p.antibiotic}</td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-mono">{p.gene}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]">{p.mechanism}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Prediction & Features */}
        <div className="lg:col-span-4 space-y-6">
          {/* Prediction Tool */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold mb-6 flex items-center gap-2 uppercase tracking-wider text-slate-500">
              <TrendingUp className="w-4 h-4 text-primary" />
              Clinical Predictor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bacterial Species</label>
                <select 
                  value={predBacteria}
                  onChange={(e) => setPredBacteria(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">Select Species</option>
                  {bacteriaTypes.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Antibiotic</label>
                <select 
                  value={predAntibiotic}
                  onChange={(e) => setPredAntibiotic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">Select Antibiotic</option>
                  {antibiotics.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Age</label>
                  <input 
                    type="number" 
                    value={predAge}
                    onChange={(e) => setPredAge(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Gender</label>
                  <select 
                    value={predGender}
                    onChange={(e) => setPredGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handlePredict}
                disabled={!metricsData || predicting}
                className={cn(
                  "w-full py-3 rounded-lg font-bold shadow-sm transition-all mt-2 flex items-center justify-center gap-2",
                  metricsData ? "bg-primary text-white hover:bg-primary/90" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {predicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Predict Outcome
              </button>

              <AnimatePresence>
                {prediction && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-lg border mt-4",
                      prediction.prediction === 'R' ? "bg-red-50 border-red-100" : 
                      prediction.prediction === 'I' ? "bg-amber-50 border-amber-100" : 
                      "bg-emerald-50 border-emerald-100"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                        prediction.prediction === 'R' ? "bg-red-100 text-red-700" : 
                        prediction.prediction === 'I' ? "bg-amber-100 text-amber-700" : 
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {prediction.prediction}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase opacity-50">Predicted Status</div>
                        <div className={cn(
                          "font-bold",
                          prediction.prediction === 'R' ? "text-red-700" : 
                          prediction.prediction === 'I' ? "text-amber-700" : 
                          "text-emerald-700"
                        )}>
                          {prediction.prediction === 'R' ? 'Resistant' : prediction.prediction === 'I' ? 'Intermediate' : 'Susceptible'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-500">CONFIDENCE</span>
                        <span className="text-slate-700">{(prediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/50 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            prediction.prediction === 'R' ? "bg-red-500" : 
                            prediction.prediction === 'I' ? "bg-amber-500" : 
                            "bg-emerald-500"
                          )}
                          style={{ width: `${prediction.confidence * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 italic mt-2">
                        * Probability distribution: 
                        {Object.entries(prediction.probabilities).map(([k, v]) => ` ${k}: ${(v * 100).toFixed(0)}%`).join(', ')}
                      </p>
                      
                      {prediction.features && (
                        <div className="mt-3 pt-3 border-t border-white/20 flex gap-4">
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">Gene Count</div>
                            <div className="text-sm font-bold text-slate-700">{prediction.features.gene_count}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase">Mutation</div>
                            <div className="text-sm font-bold text-slate-700">{prediction.features.mutation_present ? 'Detected' : 'None'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-slate-500">
              <BarChart3 className="w-4 h-4 text-primary" />
              Feature Contribution
            </h3>
            <div className="space-y-3">
              {metricsData ? metricsData.insights.feature_importance.map((f, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600 truncate max-w-[150px] uppercase">{f.feature}</span>
                    <span className="text-slate-400">{(f.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, f.importance) * 100}%` }}
                      className="bg-primary h-full rounded-full"
                    />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 italic">Initialize ML to see feature rankings.</p>
              )}
            </div>
          </div>

          {/* Scientific Insights */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl text-white">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-blue-400">
              <Zap className="w-4 h-4" />
              Pipeline Insights
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-1 h-12 bg-blue-500 rounded-full shrink-0" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Top Performer</div>
                  <div className="text-sm font-medium">
                    {metricsData ? Object.entries(metricsData.insights.top_bacteria_accuracy).sort((a, b) => b[1] - a[1])[0][0] : '--'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Highest prediction accuracy across all test folds.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-1 h-12 bg-purple-500 rounded-full shrink-0" />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Critical Feature</div>
                  <div className="text-sm font-medium">
                    {metricsData ? metricsData.insights.feature_importance[0].feature : '--'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Primary driver for resistance classification decisions.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location Insights */}
          {locationData.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-slate-500">
                <MapPin className="w-4 h-4 text-primary" />
                Geospatial Distribution
              </h3>
              <div className="space-y-3">
                {locationData.slice(0, 3).map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-50">
                    <span className="text-sm font-medium">{l.Location}</span>
                    <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono">
                      {l.CIPROFLOXACIN ? `CIP: ${l.CIPROFLOXACIN}` : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
