import { createBrowserRouter } from 'react-router';
import Dashboard from './pages/Dashboard';
import UploadReport from './pages/UploadReport';
import ReportView from './pages/ReportView';
import ManualEntry from './pages/ManualEntry';
import AnalysisResult from './pages/AnalysisResult';
import WellnessChat from './pages/WellnessChat';
import NearbyHospitals from './pages/NearbyHospitals';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Dashboard,
  },
  {
    path: '/dashboard',
    Component: Dashboard,
  },
  {
    path: '/upload',
    Component: UploadReport,
  },
  {
    path: '/report/:reportId',
    Component: ReportView,
  },
  {
    path: '/manual-entry',
    Component: ManualEntry,
  },
  {
    path: '/analysis/:analysisId',
    Component: AnalysisResult,
  },
  {
    path: '/wellness-chat',
    Component: WellnessChat,
  },
  {
    path: '/nearby-hospitals',
    Component: NearbyHospitals,
  },
  {
    path: '*',
    Component: Dashboard,
  },
]);
