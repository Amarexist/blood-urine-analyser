import { Link } from 'react-router';
import { FileText, Upload, Activity, TrendingUp, ClipboardList } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
}

interface Report {
  id: string;
  type: string;
  uploadDate: string;
  status: string;
}

export default function Dashboard() {
  const reports: Report[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">HealthTrack AI</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to your Health Dashboard
          </h2>
          <p className="text-gray-600">Enter your lab parameters or upload a report to get AI-powered health insights.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Reports</h3>
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Analyzed</h3>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {reports.filter(r => r.status === 'analyzed').length}
            </p>
          </div>

          <Link
            to="/upload"
            className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-lg shadow-sm border border-transparent hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Upload Report</h3>
              <Upload className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/90">Scan & upload medical report</p>
          </Link>

          <Link
            to="/manual-entry"
            className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-lg shadow-sm border border-transparent hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Manual Entry</h3>
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/90">Enter parameters & symptoms</p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Recent Reports</h3>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No reports uploaded yet</p>
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Report
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  to={`/report/${report.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">{report.type}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(report.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${report.status === 'analyzed'
                          ? 'bg-green-100 text-green-800'
                          : report.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {report.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
