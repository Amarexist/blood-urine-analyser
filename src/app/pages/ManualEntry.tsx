import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Activity, Droplet, Stethoscope, AlertCircle, Sliders, ChevronDown, ChevronUp, Cpu, Zap } from 'lucide-react';
import { analyzeLocally } from '../utils/localAnalyzer';
import { isMLServerAvailable, callMLBackend } from '../utils/mlopsClient';

interface BloodParameters {
  hemoglobin: string;
  wbc: string;
  rbc: string;
  platelets: string;
  glucose: string;
  cholesterol: string;
  hdl: string;
  ldl: string;
  triglycerides: string;
  hba1c: string;
  creatinine: string;
  urea: string;
  alt: string;
  ast: string;
  vitaminD: string;
  vitaminB12: string;
  iron: string;
  tsh: string;
}

interface UrineParameters {
  color: string;
  appearance: string;
  ph: string;
  specificGravity: string;
  protein: string;
  glucose: string;
  ketones: string;
  blood: string;
  bilirubin: string;
  urobilinogen: string;
  nitrite: string;
  leukocytes: string;
}

const commonSymptoms = [
  'Fatigue', 'Fever', 'Headache', 'Dizziness', 'Nausea', 'Vomiting',
  'Abdominal Pain', 'Chest Pain', 'Shortness of Breath', 'Cough',
  'Weight Loss', 'Weight Gain', 'Loss of Appetite', 'Increased Thirst',
  'Frequent Urination', 'Joint Pain', 'Muscle Pain', 'Swelling',
  'Rash', 'Night Sweats', 'Insomnia', 'Anxiety', 'Depression',
  'Blurred Vision', 'Numbness', 'Tingling', 'Weakness'
];

interface DefaultPreset {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  blood: Partial<BloodParameters>;
  urine: Partial<UrineParameters>;
  symptoms?: string[];
}

const defaultPresets: DefaultPreset[] = [
  {
    label: 'Healthy Adult',
    description: 'Normal reference ranges for a healthy adult',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    emoji: '✅',
    blood: {
      hemoglobin: '14.5',
      wbc: '7.0',
      rbc: '5.0',
      platelets: '250',
      glucose: '90',
      cholesterol: '170',
      hdl: '55',
      ldl: '90',
      triglycerides: '120',
      hba1c: '5.2',
      creatinine: '0.9',
      urea: '14',
      alt: '25',
      ast: '22',
      vitaminD: '45',
      vitaminB12: '500',
      iron: '100',
      tsh: '2.0',
    },
    urine: {
      color: 'Yellow',
      appearance: 'clear',
      ph: '6.0',
      specificGravity: '1.015',
      protein: 'negative',
      glucose: 'negative',
      ketones: 'negative',
      blood: 'negative',
      bilirubin: 'negative',
      urobilinogen: 'normal',
      nitrite: 'negative',
      leukocytes: 'negative',
    },
    symptoms: [],
  },
  {
    label: 'Diabetic Risk',
    description: 'Elevated glucose & HbA1c — pre-diabetic or T2DM pattern',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    emoji: '🍬',
    blood: {
      hemoglobin: '13.0',
      wbc: '8.5',
      rbc: '4.7',
      platelets: '220',
      glucose: '178',
      cholesterol: '240',
      hdl: '38',
      ldl: '145',
      triglycerides: '210',
      hba1c: '7.8',
      creatinine: '1.1',
      urea: '18',
      alt: '38',
      ast: '32',
      vitaminD: '18',
      vitaminB12: '300',
      iron: '85',
      tsh: '2.5',
    },
    urine: {
      color: 'Dark Yellow',
      appearance: 'clear',
      ph: '5.5',
      specificGravity: '1.022',
      protein: 'trace',
      glucose: '2+',
      ketones: 'trace',
      blood: 'negative',
      bilirubin: 'negative',
      urobilinogen: 'normal',
      nitrite: 'negative',
      leukocytes: 'negative',
    },
    symptoms: ['Increased Thirst', 'Frequent Urination', 'Fatigue', 'Blurred Vision'],
  },
  {
    label: 'Anemia',
    description: 'Low hemoglobin & RBC — iron-deficiency or B12 deficiency pattern',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    emoji: '🩸',
    blood: {
      hemoglobin: '9.5',
      wbc: '6.0',
      rbc: '3.4',
      platelets: '180',
      glucose: '88',
      cholesterol: '165',
      hdl: '48',
      ldl: '95',
      triglycerides: '110',
      hba1c: '5.1',
      creatinine: '0.8',
      urea: '12',
      alt: '20',
      ast: '18',
      vitaminD: '22',
      vitaminB12: '110',
      iron: '35',
      tsh: '2.2',
    },
    urine: {
      color: 'Pale Yellow',
      appearance: 'clear',
      ph: '6.5',
      specificGravity: '1.010',
      protein: 'negative',
      glucose: 'negative',
      ketones: 'negative',
      blood: 'negative',
      bilirubin: 'negative',
      urobilinogen: 'normal',
      nitrite: 'negative',
      leukocytes: 'negative',
    },
    symptoms: ['Fatigue', 'Weakness', 'Dizziness', 'Headache'],
  },
  {
    label: 'Kidney Concern',
    description: 'Elevated creatinine & urea — early CKD markers',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    emoji: '🫘',
    blood: {
      hemoglobin: '11.2',
      wbc: '7.5',
      rbc: '4.0',
      platelets: '200',
      glucose: '105',
      cholesterol: '210',
      hdl: '42',
      ldl: '130',
      triglycerides: '190',
      hba1c: '5.9',
      creatinine: '2.4',
      urea: '42',
      alt: '28',
      ast: '26',
      vitaminD: '20',
      vitaminB12: '350',
      iron: '70',
      tsh: '3.1',
    },
    urine: {
      color: 'Amber',
      appearance: 'cloudy',
      ph: '6.0',
      specificGravity: '1.025',
      protein: '2+',
      glucose: 'negative',
      ketones: 'negative',
      blood: '1+',
      bilirubin: 'negative',
      urobilinogen: 'normal',
      nitrite: 'negative',
      leukocytes: 'trace',
    },
    symptoms: ['Swelling', 'Fatigue', 'Nausea', 'Headache'],
  },
  {
    label: 'Liver Concern',
    description: 'Elevated ALT/AST & bilirubin — hepatic stress pattern',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-400',
    emoji: '🫀',
    blood: {
      hemoglobin: '12.8',
      wbc: '9.0',
      rbc: '4.5',
      platelets: '160',
      glucose: '95',
      cholesterol: '195',
      hdl: '40',
      ldl: '120',
      triglycerides: '160',
      hba1c: '5.5',
      creatinine: '0.9',
      urea: '16',
      alt: '112',
      ast: '98',
      vitaminD: '28',
      vitaminB12: '420',
      iron: '90',
      tsh: '2.0',
    },
    urine: {
      color: 'Dark Yellow',
      appearance: 'clear',
      ph: '6.0',
      specificGravity: '1.018',
      protein: 'trace',
      glucose: 'negative',
      ketones: 'negative',
      blood: 'negative',
      bilirubin: '2+',
      urobilinogen: '2+',
      nitrite: 'negative',
      leukocytes: 'negative',
    },
    symptoms: ['Fatigue', 'Nausea', 'Abdominal Pain', 'Loss of Appetite'],
  },
  {
    label: 'Thyroid Risk',
    description: 'Abnormal TSH — hypothyroid or hyperthyroid pattern',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    emoji: '🦋',
    blood: {
      hemoglobin: '12.0',
      wbc: '6.5',
      rbc: '4.3',
      platelets: '210',
      glucose: '92',
      cholesterol: '245',
      hdl: '45',
      ldl: '155',
      triglycerides: '175',
      hba1c: '5.4',
      creatinine: '0.85',
      urea: '15',
      alt: '30',
      ast: '28',
      vitaminD: '24',
      vitaminB12: '290',
      iron: '75',
      tsh: '8.9',
    },
    urine: {
      color: 'Yellow',
      appearance: 'clear',
      ph: '6.5',
      specificGravity: '1.014',
      protein: 'negative',
      glucose: 'negative',
      ketones: 'negative',
      blood: 'negative',
      bilirubin: 'negative',
      urobilinogen: 'normal',
      nitrite: 'negative',
      leukocytes: 'negative',
    },
    symptoms: ['Fatigue', 'Weight Gain', 'Depression', 'Weakness'],
  },
];

export default function ManualEntry() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'blood' | 'urine' | 'symptoms'>('blood');
  const [bloodParams, setBloodParams] = useState<Partial<BloodParameters>>({});
  const [urineParams, setUrineParams] = useState<Partial<UrineParameters>>({});
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [patientInfo, setPatientInfo] = useState({ age: '', gender: '', weight: '', height: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyPreset = (preset: DefaultPreset) => {
    setBloodParams(preset.blood);
    setUrineParams(preset.urine);
    if (preset.symptoms) setSelectedSymptoms(preset.symptoms);
    setActivePreset(preset.label);
  };

  const clearAll = () => {
    setBloodParams({});
    setUrineParams({});
    setSelectedSymptoms([]);
    setActivePreset(null);
  };

  const handleBloodChange = (field: keyof BloodParameters, value: string) => {
    setBloodParams(prev => ({ ...prev, [field]: value }));
  };

  const handleUrineChange = (field: keyof UrineParameters, value: string) => {
    setUrineParams(prev => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // ── Try MLOps XGBoost backend first ──────────────────────────────────
      const mlAvailable = await isMLServerAvailable();

      if (mlAvailable) {
        try {
          const allParams = {
            ...bloodParams,
            urineProtein:    urineParams.protein,
            urineGlucose:    urineParams.glucose,
            urineKetones:    urineParams.ketones,
            urineBlood:      urineParams.blood,
            urineNitrite:    urineParams.nitrite,
            urineLeukocytes: urineParams.leukocytes,
          };
          const mlResult = await callMLBackend(allParams);

          // Build a result object compatible with AnalysisResult page
          const analysisId = `ml-${Date.now().toString(36)}`;
          const enriched = {
            id: analysisId,
            source: 'ml-model',
            patientInfo,
            mlPrediction: mlResult,
            // Also run local engine for diet/nutrition/lifestyle recommendations
            ...analyzeLocally({
              patientInfo,
              bloodParameters: bloodParams as Record<string, string>,
              urineParameters: urineParams as Record<string, string>,
              symptoms: selectedSymptoms,
            }),
            id: analysisId,
            mlPrediction: mlResult,
            source: 'ml-model',
          };
          sessionStorage.setItem(`analysis_${analysisId}`, JSON.stringify(enriched));
          navigate(`/analysis/${analysisId}`);
          return;
        } catch (mlErr) {
          console.warn('ML backend error — falling back to rule engine', mlErr);
        }
      }

      // ── Fallback: local rule-based engine ────────────────────────────────
      const result = analyzeLocally({
        patientInfo,
        bloodParameters: bloodParams as Record<string, string>,
        urineParameters: urineParams as Record<string, string>,
        symptoms: selectedSymptoms,
      });
      sessionStorage.setItem(`analysis_${result.id}`, JSON.stringify({ ...result, source: 'rule-engine' }));
      navigate(`/analysis/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link
              to="/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Manual Parameter Entry</h2>
            <p className="text-gray-600">
              Enter test parameters and symptoms for AI-powered disease prediction and personalized recommendations
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="p-6">

            {/* ── DEFAULT PARAMETERS PRESET PANEL ── */}
            <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setPresetsOpen(!presetsOpen)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-slate-300" />
                  <div className="text-left">
                    <p className="font-semibold text-sm tracking-wide">Default Parameters</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activePreset ? `Active preset: ${activePreset}` : 'Choose a preset profile to auto-fill all fields'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {activePreset && (
                    <span className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full font-medium">
                      {activePreset}
                    </span>
                  )}
                  {presetsOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-300" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-300" />
                  )}
                </div>
              </button>

              {presetsOpen && (
                <div className="bg-slate-50 px-5 py-5 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">
                    Select a clinical profile — all blood, urine & symptom fields will be pre-filled with representative values
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {defaultPresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyPreset(preset)}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${activePreset === preset.label
                            ? `${preset.bgColor} ${preset.borderColor} shadow-sm`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <span className="text-2xl leading-none mt-0.5">{preset.emoji}</span>
                        <div>
                          <p className={`text-sm font-semibold ${activePreset === preset.label ? preset.color : 'text-gray-800'
                            }`}>
                            {preset.label}
                            {activePreset === preset.label && (
                              <span className="ml-2 text-xs font-normal opacity-70">● Active</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {activePreset && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={clearAll}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 border border-gray-300 hover:border-red-300 px-4 py-2 rounded-lg transition-all bg-white hover:bg-red-50"
                      >
                        <span>✕</span> Clear All & Reset
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* ── END DEFAULT PARAMETERS ── */}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={patientInfo.age}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={patientInfo.gender}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={patientInfo.weight}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    value={patientInfo.height}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="cm"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('blood')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'blood'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Blood Parameters
              </button>
              <button
                onClick={() => setActiveTab('urine')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'urine'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Droplet className="w-4 h-4 inline mr-2" />
                Urine Parameters
              </button>
              <button
                onClick={() => setActiveTab('symptoms')}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'symptoms'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Stethoscope className="w-4 h-4 inline mr-2" />
                Symptoms ({selectedSymptoms.length})
              </button>
            </div>

            {activeTab === 'blood' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hemoglobin (g/dL)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={bloodParams.hemoglobin || ''}
                      onChange={(e) => handleBloodChange('hemoglobin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="13.5-17.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WBC (×10³/μL)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={bloodParams.wbc || ''}
                      onChange={(e) => handleBloodChange('wbc', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="4.5-11.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RBC (×10⁶/μL)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={bloodParams.rbc || ''}
                      onChange={(e) => handleBloodChange('rbc', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="4.5-5.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platelets (×10³/μL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.platelets || ''}
                      onChange={(e) => handleBloodChange('platelets', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="150-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Glucose (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.glucose || ''}
                      onChange={(e) => handleBloodChange('glucose', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="70-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Cholesterol (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.cholesterol || ''}
                      onChange={(e) => handleBloodChange('cholesterol', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="<200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HDL Cholesterol (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.hdl || ''}
                      onChange={(e) => handleBloodChange('hdl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder=">40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LDL Cholesterol (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.ldl || ''}
                      onChange={(e) => handleBloodChange('ldl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="<100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Triglycerides (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.triglycerides || ''}
                      onChange={(e) => handleBloodChange('triglycerides', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="<150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HbA1c (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={bloodParams.hba1c || ''}
                      onChange={(e) => handleBloodChange('hba1c', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="<5.7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Creatinine (mg/dL)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={bloodParams.creatinine || ''}
                      onChange={(e) => handleBloodChange('creatinine', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.7-1.3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Urea (mg/dL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.urea || ''}
                      onChange={(e) => handleBloodChange('urea', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="7-20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ALT (U/L)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.alt || ''}
                      onChange={(e) => handleBloodChange('alt', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="7-56"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AST (U/L)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.ast || ''}
                      onChange={(e) => handleBloodChange('ast', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10-40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vitamin D (ng/mL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.vitaminD || ''}
                      onChange={(e) => handleBloodChange('vitaminD', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vitamin B12 (pg/mL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.vitaminB12 || ''}
                      onChange={(e) => handleBloodChange('vitaminB12', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="200-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Iron (μg/dL)
                    </label>
                    <input
                      type="number"
                      value={bloodParams.iron || ''}
                      onChange={(e) => handleBloodChange('iron', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="60-170"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TSH (mIU/L)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={bloodParams.tsh || ''}
                      onChange={(e) => handleBloodChange('tsh', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.4-4.0"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'urine' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                    <input
                      type="text"
                      value={urineParams.color || ''}
                      onChange={(e) => handleUrineChange('color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Yellow, Amber, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Appearance</label>
                    <select
                      value={urineParams.appearance || ''}
                      onChange={(e) => handleUrineChange('appearance', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="clear">Clear</option>
                      <option value="cloudy">Cloudy</option>
                      <option value="turbid">Turbid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">pH</label>
                    <input
                      type="number"
                      step="0.1"
                      value={urineParams.ph || ''}
                      onChange={(e) => handleUrineChange('ph', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5.0-7.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Gravity
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={urineParams.specificGravity || ''}
                      onChange={(e) => handleUrineChange('specificGravity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1.005-1.030"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Protein</label>
                    <select
                      value={urineParams.protein || ''}
                      onChange={(e) => handleUrineChange('protein', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="negative">Negative</option>
                      <option value="trace">Trace</option>
                      <option value="1+">1+</option>
                      <option value="2+">2+</option>
                      <option value="3+">3+</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Glucose</label>
                    <select
                      value={urineParams.glucose || ''}
                      onChange={(e) => handleUrineChange('glucose', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="negative">Negative</option>
                      <option value="trace">Trace</option>
                      <option value="1+">1+</option>
                      <option value="2+">2+</option>
                      <option value="3+">3+</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ketones</label>
                    <select
                      value={urineParams.ketones || ''}
                      onChange={(e) => handleUrineChange('ketones', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="negative">Negative</option>
                      <option value="trace">Trace</option>
                      <option value="small">Small</option>
                      <option value="moderate">Moderate</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood</label>
                    <select
                      value={urineParams.blood || ''}
                      onChange={(e) => handleUrineChange('blood', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="negative">Negative</option>
                      <option value="trace">Trace</option>
                      <option value="1+">1+</option>
                      <option value="2+">2+</option>
                      <option value="3+">3+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bilirubin</label>
                    <select
                      value={urineParams.bilirubin || ''}
                      onChange={(e) => handleUrineChange('bilirubin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="negative">Negative</option>
                      <option value="small">Small</option>
                      <option value="moderate">Moderate</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Urobilinogen</label>
                    <select
                      value={urineParams.urobilinogen || ''}
                      onChange={(e) => handleUrineChange('urobilinogen', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="normal">Normal</option>
                      <option value="1+">1+</option>
                      <option value="2+">2+</option>
                      <option value="3+">3+</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nitrite</label>
                    <select
                      value={urineParams.nitrite || ''}
                      onChange={(e) => handleUrineChange('nitrite', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="negative">Negative</option>
                      <option value="positive">Positive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leukocytes</label>
                    <select
                      value={urineParams.leukocytes || ''}
                      onChange={(e) => handleUrineChange('leukocytes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="negative">Negative</option>
                      <option value="trace">Trace</option>
                      <option value="small">Small</option>
                      <option value="moderate">Moderate</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'symptoms' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select all symptoms that apply
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {commonSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${selectedSymptoms.includes(symptom)
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{symptom}</span>
                        {selectedSymptoms.includes(symptom) && (
                          <span className="text-blue-600">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Analyzing...' : 'Analyze & Get Recommendations'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
