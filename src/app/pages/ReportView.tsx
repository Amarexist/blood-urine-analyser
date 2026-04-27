import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, FileText, TrendingUp, TrendingDown, Activity, Utensils, Heart } from 'lucide-react';
import { projectId } from '/utils/supabase/info';

interface ReportData {
  id: string;
  type: string;
  uploadDate: string;
  status: string;
  fileUrl?: string;
  analysis?: {
    summary: string;
    keyFindings: Array<{
      parameter: string;
      value: string;
      status: 'normal' | 'high' | 'low';
      reference: string;
    }>;
  };
  recommendations?: {
    diet: string[];
    nutrition: string[];
    lifestyle: string[];
  };
}

export default function ReportView() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      navigate('/signin');
      return;
    }

    loadReport(reportId!, accessToken);
  }, [reportId, navigate]);

  const loadReport = async (id: string, accessToken: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4192e10b/report/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        console.error('Failed to load report');
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Report not found</p>
          <Link
            to="/dashboard"
            className="text-blue-600 hover:underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600';
      case 'high':
        return 'text-red-600';
      case 'low':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <Activity className="w-5 h-5" />;
      case 'high':
        return <TrendingUp className="w-5 h-5" />;
      case 'low':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Test Report
              </h1>
              <p className="text-gray-600">
                Uploaded on {new Date(report.uploadDate).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                report.status === 'analyzed'
                  ? 'bg-green-100 text-green-800'
                  : report.status === 'processing'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {report.status}
            </span>
          </div>
        </div>

        {report.status === 'processing' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-yellow-800">
              Your report is being analyzed. This may take a few moments. Please refresh the page to see updates.
            </p>
          </div>
        )}

        {report.analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Summary</h2>
                <p className="text-gray-700 leading-relaxed">{report.analysis.summary}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Findings</h2>
                <div className="space-y-4">
                  {report.analysis.keyFindings.map((finding, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`mr-2 ${getStatusColor(finding.status)}`}>
                            {getStatusIcon(finding.status)}
                          </span>
                          <h3 className="font-semibold text-gray-900">{finding.parameter}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">
                          Value: <span className="font-medium">{finding.value}</span>
                        </p>
                        <p className="text-gray-500 text-sm">Reference: {finding.reference}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                          finding.status === 'normal'
                            ? 'bg-green-100 text-green-800'
                            : finding.status === 'high'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {finding.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {report.recommendations && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
                  <div className="flex items-center mb-4">
                    <Utensils className="w-6 h-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">Diet Plan</h2>
                  </div>
                  <ul className="space-y-2">
                    {report.recommendations.diet.map((item, index) => (
                      <li key={index} className="flex items-start text-gray-700">
                        <span className="text-blue-600 mr-2">•</span>
                        <span>{item}</span>
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
                    {report.recommendations.nutrition.map((item, index) => (
                      <li key={index} className="flex items-start text-gray-700">
                        <span className="text-green-600 mr-2">•</span>
                        <span>{item}</span>
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
                    {report.recommendations.lifestyle.map((item, index) => (
                      <li key={index} className="flex items-start text-gray-700">
                        <span className="text-purple-600 mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
