import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, AlertTriangle, CheckCircle, TrendingUp, Utensils, Activity, Heart, Pill } from 'lucide-react';

interface Disease {
  name: string;
  probability: number;
  description: string;
  severity: 'low' | 'moderate' | 'high';
}

interface AnalysisData {
  id: string;
  timestamp: string;
  patientInfo: {
    age: string;
    gender: string;
    weight: string;
    height: string;
  };
  diseases: Disease[];
  recommendations: {
    diet: string[];
    nutrition: string[];
    lifestyle: string[];
    medications?: string[];
  };
  followUp: string[];
  abnormalParameters: Array<{
    parameter: string;
    value: string;
    status: 'high' | 'low';
    reference: string;
  }>;
}

export default function AnalysisResult() {
  const { analysisId } = useParams();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!analysisId) { setLoading(false); return; }
    // Local analysis — read from sessionStorage
    if (analysisId.startsWith('local-')) {
      const raw = sessionStorage.getItem(`analysis_${analysisId}`);
      if (raw) setAnalysis(JSON.parse(raw));
      setLoading(false);
      return;
    }
    // Remote analysis fallback
    loadAnalysis(analysisId);
  }, [analysisId]);

  const loadAnalysis = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4192e10b/analysis/${id}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading analysis...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Analysis not found</p>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const bmi = analysis.patientInfo.weight && analysis.patientInfo.height
    ? (parseFloat(analysis.patientInfo.weight) / Math.pow(parseFloat(analysis.patientInfo.height) / 100, 2)).toFixed(1)
    : null;

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Analysis Report</h1>
          <p className="text-gray-600">
            Analysis Date: {new Date(analysis.timestamp).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Age</h3>
            <p className="text-2xl font-bold text-gray-900">{analysis.patientInfo.age} years</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Gender</h3>
            <p className="text-2xl font-bold text-gray-900 capitalize">{analysis.patientInfo.gender}</p>
          </div>
          {bmi && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">BMI</h3>
              <p className="text-2xl font-bold text-gray-900">{bmi}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Disease Prediction</h2>
              </div>
              <div className="space-y-4">
                {analysis.diseases.map((disease, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${getSeverityColor(disease.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{disease.name}</h3>
                        <p className="text-sm mb-2">{disease.description}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold">{disease.probability}%</div>
                        <div className="text-xs uppercase font-medium">{disease.severity} Risk</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-current rounded-full transition-all"
                          style={{ width: `${disease.probability}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {analysis.abnormalParameters.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-6 h-6 text-red-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Abnormal Parameters</h2>
                </div>
                <div className="space-y-3">
                  {analysis.abnormalParameters.map((param, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{param.parameter}</h4>
                        <p className="text-sm text-gray-600">Reference: {param.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${param.status === 'high' ? 'text-red-600' : 'text-orange-600'
                          }`}>
                          {param.value}
                        </p>
                        <p className="text-xs uppercase font-medium text-gray-500">{param.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.followUp.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Follow-Up Actions</h2>
                </div>
                <ul className="space-y-2">
                  {analysis.followUp.map((action, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <span className="text-blue-600 mr-2 mt-1">→</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center mb-4">
                <Utensils className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Diet Plan</h2>
              </div>
              <ul className="space-y-2">
                {analysis.recommendations.diet.map((item, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
              <div className="flex items-center mb-4">
                <Activity className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Nutrition</h2>
              </div>
              <ul className="space-y-2">
                {analysis.recommendations.nutrition.map((item, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <span className="text-green-600 mr-2">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
              <div className="flex items-center mb-4">
                <Heart className="w-6 h-6 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Lifestyle</h2>
              </div>
              <ul className="space-y-2">
                {analysis.recommendations.lifestyle.map((item, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <span className="text-purple-600 mr-2">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {analysis.recommendations.medications && analysis.recommendations.medications.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6">
                <div className="flex items-center mb-4">
                  <Pill className="w-6 h-6 text-orange-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Medication Suggestions</h2>
                </div>
                <ul className="space-y-2">
                  {analysis.recommendations.medications.map((item, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <span className="text-orange-600 mr-2">•</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-orange-800 bg-orange-100 p-3 rounded">
                  <strong>Important:</strong> These are AI-generated suggestions. Always consult with a healthcare professional before starting any medication.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Medical Disclaimer:</strong> This analysis is AI-generated and for informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
        </div>
      </div>
    </div>
  );
}
