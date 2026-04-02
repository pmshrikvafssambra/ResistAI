
import fs from 'fs';
import Papa from 'papaparse';

export interface ResistanceData {
  bacteria: string;
  antibiotic: string;
  status: 'R' | 'S' | 'I';
  age?: number;
  gender?: string;
  location?: string;
}

export interface CardPrior {
  bacteria: string;
  antibiotic: string;
  gene: string;
  mechanism: string;
}

export function loadTabularData(): ResistanceData[] {
  const csvData = fs.readFileSync('Bacteria_dataset_Multiresictance.csv', 'utf8');
  const results = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  
  const data: ResistanceData[] = [];
  const antiCols = ['AMX/AMP', 'AMC', 'CZ', 'FOX', 'CTX/CRO', 'IPM', 'GEN', 'AN', 'Acide nalidixique', 'ofx', 'CIP', 'C', 'Co-trimoxazole', 'Furanes', 'colistine'];
  
  results.data.forEach((row: any) => {
    const souches = row['Souches'] || '';
    const bacteriaMatch = souches.match(/S\d+\s+(.*)/);
    const bacteria = bacteriaMatch ? bacteriaMatch[1].trim() : souches.trim();
    
    const ageGender = row['age/gender'] || '';
    const ageMatch = ageGender.match(/(\d+)/);
    const age = ageMatch ? parseInt(ageMatch[1]) : undefined;
    const gender = ageGender.includes('/F') ? 'F' : (ageGender.includes('/M') ? 'M' : 'Unknown');
    
    antiCols.forEach(col => {
      if (row[col]) {
        data.push({
          bacteria,
          antibiotic: col,
          status: row[col] as 'R' | 'S' | 'I',
          age,
          gender
        });
      }
    });
  });
  
  return data;
}

export function loadCardData(): CardPrior[] {
  try {
    const jsonData = fs.readFileSync('card-diff-v4.0.0-4.0.1.json', 'utf8');
    const card = JSON.parse(jsonData);
    const priors: CardPrior[] = [];
    
    // The CARD JSON structure can be complex. Let's try to find the models.
    // Sometimes it's in a top-level object, sometimes nested.
    const models = card['$insert'] || card;
    
    Object.values(models).forEach((model: any) => {
      if (!model || typeof model !== 'object') return;
      
      const gene = model['ARO_name'];
      const mechanism = model['ARO_description'];
      if (!gene) return;
      
      const bacteriaList: string[] = [];
      if (model['model_sequences'] && model['model_sequences']['sequence']) {
        Object.values(model['model_sequences']['sequence']).forEach((seq: any) => {
          const name = seq['NCBI_taxonomy']?.['NCBI_taxonomy_name'];
          if (name) bacteriaList.push(name);
        });
      }
      
      const antibiotics: string[] = [];
      if (model['ARO_category']) {
        Object.values(model['ARO_category']).forEach((cat: any) => {
          if (cat['category_aro_class_name'] === 'Antibiotic') {
            antibiotics.push(cat['category_aro_name']);
          }
        });
      }
      
      bacteriaList.forEach(b => {
        antibiotics.forEach(a => {
          priors.push({ bacteria: b, antibiotic: a, gene, mechanism });
        });
      });
    });
    
    console.log(`Loaded ${priors.length} CARD priors.`);
    return priors;
  } catch (error) {
    console.error("Error loading CARD data:", error);
    return [];
  }
}

export function loadLocationData(): any[] {
  if (!fs.existsSync('Dataset.csv')) return [];
  const csvData = fs.readFileSync('Dataset.csv', 'utf8');
  const results = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  return results.data;
}

export function getStats(data: ResistanceData[]) {
  const stats: any = {};
  data.forEach(d => {
    if (!stats[d.bacteria]) stats[d.bacteria] = {};
    if (!stats[d.bacteria][d.antibiotic]) stats[d.bacteria][d.antibiotic] = { R: 0, S: 0, I: 0 };
    stats[d.bacteria][d.antibiotic][d.status]++;
  });
  return stats;
}
