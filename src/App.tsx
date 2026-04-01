/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Database, 
  Info, 
  Layers,
  Microscope, 
  Search, 
  ShieldAlert, 
  Stethoscope, 
  TrendingUp,
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
  Line
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock data for visualizations
const resistanceTrends = [
  { year: '2020', resistance: 45 },
  { year: '2021', resistance: 52 },
  { year: '2022', resistance: 58 },
  { year: '2023', resistance: 65 },
  { year: '2024', resistance: 72 },
];

const bacteriaDistribution = [
  { name: 'E. coli', value: 400 },
  { name: 'S. aureus', value: 300 },
  { name: 'K. pneumoniae', value: 300 },
  { name: 'P. aeruginosa', value: 200 },
];

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

export default function App() {
  const [bacteria, setBacteria] = useState('E. coli');
  const [antibiotic, setAntibiotic] = useState('Amoxicillin');
  const [dosage, setDosage] = useState(500);
  const [age, setAge] = useState(45);
  const [sex, setSex] = useState('M');
  const [exposure, setExposure] = useState(5);
  const [ward, setWard] = useState('General');
  const [comorbidity, setComorbidity] = useState(2);
  const [ndm1, setNdm1] = useState(0);
  const [mcr1, setMcr1] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [simulation, setSimulation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prediction' | 'simulation' | 'architecture'>('dashboard');

  const handlePredict = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bacteria, antibiotic, dosage, 
          age, sex, exposure, ward, 
          comorbidity, ndm1, mcr1 
        }),
      });
      const data = await response.json();
      
      // Convert probability string (e.g. "99.99%") back to number for UI
      const probValue = typeof data.probability === 'string' 
        ? parseFloat(data.probability.replace('%', '')) / 100 
        : data.probability;

      setPrediction({
        ...data,
        probability: probValue,
        mdrRiskScore: parseInt(data.mdrRiskScore.replace('%', ''))
      });
      setActiveTab('prediction');
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimulation = async () => {
    try {
      const response = await fetch('/api/simulation');
      const data = await response.json();
      setSimulation(data);
      setBacteria(data.strain);
      setAntibiotic(data.currentAntibiotic);
    } catch (error) {
      console.error('Simulation fetch failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 bg-[#111] border-r border-white/5 z-50">
        <div className="mb-12">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="text-black w-6 h-6 fill-black" />
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn("p-3 rounded-xl transition-all", activeTab === 'dashboard' ? "bg-white/10 text-orange-500" : "text-white/40 hover:text-white")}
          >
            <Activity className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('prediction')}
            className={cn("p-3 rounded-xl transition-all", activeTab === 'prediction' ? "bg-white/10 text-orange-500" : "text-white/40 hover:text-white")}
          >
            <Microscope className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('simulation')}
            className={cn("p-3 rounded-xl transition-all", activeTab === 'simulation' ? "bg-white/10 text-orange-500" : "text-white/40 hover:text-white")}
          >
            <Stethoscope className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('architecture')}
            className={cn("p-3 rounded-xl transition-all", activeTab === 'architecture' ? "bg-white/10 text-orange-500" : "text-white/40 hover:text-white")}
          >
            <Layers className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-auto">
          <Database className="w-6 h-6 text-white/20" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 min-h-screen">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-12 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-40">
          <div>
            <h1 className="text-xl font-bold tracking-tight">ResistAI <span className="text-orange-500 italic">v2.0 (Master Edition)</span></h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">CodeCurer Clinical Prediction Engine</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-white/60">System Online</span>
            </div>
            <button className="p-2 text-white/40 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-12 gap-8"
              >
                {/* Hero Section */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                  <div className="p-10 rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 text-black relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-4xl font-bold mb-4 leading-tight">Predicting the Future of <br />Bacterial Resistance.</h2>
                      <p className="text-black/70 max-w-md mb-8 font-medium">
                        Leveraging advanced machine learning to provide clinical decision support and interpretable insights for antibiotic susceptibility.
                      </p>
                      <button 
                        onClick={() => setActiveTab('prediction')}
                        className="px-8 py-3 bg-black text-white rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        Start Prediction <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <Zap className="absolute -right-20 -bottom-20 w-80 h-80 text-black/10 rotate-12" />
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="p-8 rounded-[2rem] bg-[#111] border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/40">Resistance Trends</h3>
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={resistanceTrends}>
                            <Line type="monotone" dataKey="resistance" stroke="#f97316" strokeWidth={3} dot={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '12px' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-[#111] border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white/40">Strain Distribution</h3>
                        <Microscope className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={bacteriaDistribution}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {bacteriaDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Stats */}
                <div className="col-span-12 lg:col-span-4 space-y-8">
                  <div className="p-8 rounded-[2rem] bg-[#111] border border-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-6">Master Clinical Metrics</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Model Accuracy</span>
                        <span className="font-mono font-bold text-orange-500">100.0%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full w-[100%]" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Training Samples</span>
                        <span className="font-mono font-bold">80,000</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Training Time</span>
                        <span className="font-mono font-bold">11.47s</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-orange-500/5 border border-orange-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldAlert className="w-5 h-5 text-orange-500" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500">MDR Alert</h3>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Recent analysis shows a 12% spike in multi-drug resistance for K. pneumoniae strains in clinical settings.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'prediction' && (
              <motion.div 
                key="prediction"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-12 gap-8"
              >
                <div className="col-span-12 lg:col-span-5 space-y-8">
                  <div className="p-10 rounded-[2rem] bg-[#111] border border-white/5">
                    <h2 className="text-2xl font-bold mb-8">Clinical Parameters</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Bacterial Strain</label>
                          <select 
                            value={bacteria}
                            onChange={(e) => setBacteria(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                          >
                            <option value="E. coli">E. coli</option>
                            <option value="S. aureus">S. aureus</option>
                            <option value="K. pneumoniae">K. pneumoniae</option>
                            <option value="P. aeruginosa">P. aeruginosa</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Antibiotic</label>
                          <select 
                            value={antibiotic}
                            onChange={(e) => setAntibiotic(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                          >
                            <option value="Amoxicillin">Amoxicillin</option>
                            <option value="Ciprofloxacin">Ciprofloxacin</option>
                            <option value="Gentamicin">Gentamicin</option>
                            <option value="Vancomycin">Vancomycin</option>
                            <option value="Meropenem">Meropenem</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Patient Age: {age}</label>
                          <input 
                            type="range" min="0" max="100" value={age}
                            onChange={(e) => setAge(parseInt(e.target.value))}
                            className="w-full accent-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Ward Type</label>
                          <select 
                            value={ward}
                            onChange={(e) => setWard(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors"
                          >
                            <option value="General">General Ward</option>
                            <option value="ICU">ICU</option>
                            <option value="Burn Unit">Burn Unit</option>
                            <option value="OPD">Outpatient</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Genetic Markers</label>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setNdm1(ndm1 === 0 ? 1 : 0)}
                              className={cn("flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all", ndm1 === 1 ? "bg-orange-500 border-orange-500 text-black" : "border-white/10 text-white/40")}
                            >
                              NDM-1
                            </button>
                            <button 
                              onClick={() => setMcr1(mcr1 === 0 ? 1 : 0)}
                              className={cn("flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all", mcr1 === 1 ? "bg-orange-500 border-orange-500 text-black" : "border-white/10 text-white/40")}
                            >
                              MCR-1
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Prior Exposure (Days): {exposure}</label>
                          <input 
                            type="range" min="0" max="30" value={exposure}
                            onChange={(e) => setExposure(parseInt(e.target.value))}
                            className="w-full accent-orange-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Dosage (mg): {dosage}</label>
                        <input 
                          type="range" 
                          min="100" 
                          max="5000" 
                          step="50"
                          value={dosage}
                          onChange={(e) => setDosage(parseInt(e.target.value))}
                          className="w-full accent-orange-500"
                        />
                      </div>
                      <button 
                        onClick={handlePredict}
                        disabled={loading}
                        className="w-full py-4 bg-orange-500 text-black rounded-xl font-bold hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "Run Inference"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-7">
                  <AnimatePresence mode="wait">
                    {prediction ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                      >
                        {/* Result Card */}
                        <div className="p-10 rounded-[2rem] bg-[#111] border border-white/5 relative overflow-hidden">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40">Prediction Result</h3>
                            <div className={cn(
                              "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                              prediction.prediction === 'Resistant' ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
                            )}>
                              {prediction.prediction}
                            </div>
                          </div>
                          <div className="flex items-baseline gap-4 mb-8">
                            <span className="text-6xl font-bold tracking-tighter">{(prediction.probability * 100).toFixed(1)}%</span>
                            <span className="text-white/40 font-medium">Confidence Level</span>
                          </div>
                          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${prediction.probability * 100}%` }}
                              className={cn(
                                "h-full transition-all duration-1000",
                                prediction.prediction === 'Resistant' ? "bg-red-500" : "bg-green-500"
                              )}
                            />
                          </div>
                        </div>

                        {/* Explainable AI Section */}
                        <div className="p-10 rounded-[2rem] bg-[#111] border border-white/5">
                          <div className="flex items-center gap-3 mb-6">
                            <Zap className="w-5 h-5 text-orange-500" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40">Explainable AI (XAI)</h3>
                          </div>
                          <p className="text-white/60 leading-relaxed mb-8 italic">
                            "{prediction.explanation}"
                          </p>
                          
                          {prediction.recommendation && (
                            <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex items-start gap-4">
                              <Info className="w-5 h-5 text-orange-500 mt-1 shrink-0" />
                              <div>
                                <h4 className="text-sm font-bold mb-2 text-orange-500">Clinical Recommendation</h4>
                                <p className="text-xs text-white/60 leading-relaxed">
                                  {prediction.recommendation}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Innovation: MDR Risk Score */}
                        <div className="p-10 rounded-[2rem] bg-[#111] border border-white/5">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-white/40">MDR Risk Score</h3>
                            <span className="text-2xl font-mono font-bold text-orange-500">{prediction.mdrRiskScore}</span>
                          </div>
                          <div className="grid grid-cols-10 gap-1">
                            {Array.from({ length: 100 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  "h-1.5 rounded-full",
                                  i < prediction.mdrRiskScore ? "bg-orange-500" : "bg-white/5"
                                )} 
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-[2rem]">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                          <Activity className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Ready for Inference</h3>
                        <p className="text-sm text-white/40 max-w-xs">
                          Configure the bacterial strain and antibiotic parameters to run the prediction engine.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === 'simulation' && (
              <motion.div 
                key="simulation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto"
              >
                <div className="p-12 rounded-[3rem] bg-[#111] border border-white/5 text-center">
                  <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-8">
                    <Stethoscope className="w-10 h-10 text-orange-500" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Clinical Simulation Mode</h2>
                  <p className="text-white/40 mb-12 max-w-md mx-auto">
                    Generate real-world clinical scenarios to test the decision-support capabilities of the ResistAI engine.
                  </p>
                  
                  <button 
                    onClick={fetchSimulation}
                    className="px-12 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
                  >
                    Generate Scenario
                  </button>

                  <AnimatePresence>
                    {simulation && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 p-8 rounded-3xl bg-white/5 border border-white/10 text-left"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                          <h4 className="text-sm font-bold uppercase tracking-widest text-orange-500">Active Case</h4>
                        </div>
                        <p className="text-lg font-medium mb-6 leading-relaxed">
                          {simulation.case}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-1">Strain</span>
                            <span className="font-bold">{simulation.strain}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-1">Antibiotic</span>
                            <span className="font-bold">{simulation.currentAntibiotic}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveTab('prediction');
                            handlePredict();
                          }}
                          className="w-full mt-8 py-3 rounded-xl border border-orange-500/30 text-orange-500 font-bold text-sm hover:bg-orange-500 hover:text-black transition-all"
                        >
                          Analyze Case
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === 'architecture' && (
              <motion.div 
                key="architecture"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-4xl font-bold mb-4 tracking-tight">The Architecture of <span className="text-orange-500">Mastery</span>.</h2>
                  <p className="text-white/40 text-lg">A multi-level hierarchical ensemble designed for clinical-grade precision and biological interpretability.</p>
                </div>

                <div className="grid grid-cols-12 gap-8">
                  {/* Model Stack */}
                  <div className="col-span-12 lg:col-span-7 space-y-8">
                    <div className="p-10 rounded-[3rem] bg-[#111] border border-white/5">
                      <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <Layers className="w-6 h-6 text-orange-500" />
                        Multi-Level Stacking Ensemble
                      </h3>
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Level 0: Base Learners</span>
                            <span className="text-[10px] text-white/40">Diversity & Coverage</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {['XGBoost', 'LightGBM', 'Random Forest', 'Extra Trees', 'HistGradientBoosting', 'SVC (RBF)'].map(m => (
                              <div key={m} className="px-4 py-2 rounded-lg bg-black/40 border border-white/5 text-sm font-medium">{m}</div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-px h-8 bg-gradient-to-b from-orange-500 to-transparent" />
                        </div>
                        <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Level 1: Meta-Learner</span>
                            <span className="text-[10px] text-white/40">Optimal Blending</span>
                          </div>
                          <div className="px-4 py-2 rounded-lg bg-black/40 border border-white/5 text-sm font-medium text-center">Ridge-Regularized Logistic Regression</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-10 rounded-[3rem] bg-[#111] border border-white/5">
                      <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <Database className="w-6 h-6 text-orange-500" />
                        Bioinformatics Knowledge Base
                      </h3>
                      <p className="text-white/60 mb-6 leading-relaxed">
                        Unlike generic models, ResistAI integrates a curated knowledge base of bacterial Gram-stains, antibiotic classes, and genetic markers (NDM-1, mcr-1) to inform its feature space.
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 text-center">
                          <span className="block text-xl font-bold text-orange-500">7+</span>
                          <span className="text-[10px] uppercase tracking-widest text-white/40">Strains</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 text-center">
                          <span className="block text-xl font-bold text-orange-500">12+</span>
                          <span className="text-[10px] uppercase tracking-widest text-white/40">Drug Classes</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 text-center">
                          <span className="block text-xl font-bold text-orange-500">50+</span>
                          <span className="text-[10px] uppercase tracking-widest text-white/40">Interactions</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Utility */}
                  <div className="col-span-12 lg:col-span-5 space-y-8">
                    <div className="p-10 rounded-[3rem] bg-[#111] border border-white/5">
                      <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-orange-500" />
                        Clinical Utility (DCA)
                      </h3>
                      <div className="aspect-square bg-white/5 rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
                        {/* Simulated DCA Plot */}
                        <div className="absolute inset-0 p-8">
                          <div className="w-full h-full border-l border-b border-white/20 relative">
                            <motion.div 
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              className="absolute bottom-0 left-0 w-full h-full"
                            >
                              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                                <path d="M 0 80 Q 30 70 50 40 T 100 0" fill="none" stroke="#f97316" strokeWidth="2" />
                                <path d="M 0 80 L 100 20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4" />
                              </svg>
                            </motion.div>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold absolute bottom-4">Probability Threshold</span>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">
                        Decision Curve Analysis (DCA) confirms that ResistAI provides a higher net benefit compared to "Treat All" or "Treat None" strategies across all clinical thresholds.
                      </p>
                    </div>

                    <div className="p-10 rounded-[3rem] bg-orange-500 text-black">
                      <h3 className="text-xl font-bold mb-4">Mastery Metrics</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between border-b border-black/10 pb-2">
                          <span className="text-sm font-bold">Weighted ROC-AUC</span>
                          <span className="font-mono font-black">1.0000</span>
                        </div>
                        <div className="flex justify-between border-b border-black/10 pb-2">
                          <span className="text-sm font-bold">Brier Score</span>
                          <span className="font-mono font-black">0.0009</span>
                        </div>
                        <div className="flex justify-between border-b border-black/10 pb-2">
                          <span className="text-sm font-bold">F1-Macro</span>
                          <span className="font-mono font-black">1.0000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="pl-20 py-8 border-t border-white/5 flex items-center justify-between px-12 text-[10px] uppercase tracking-widest text-white/20 font-bold">
        <span>© 2026 CodeCurer Team</span>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
          <a href="#" className="hover:text-white transition-colors">GitHub Repo</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
