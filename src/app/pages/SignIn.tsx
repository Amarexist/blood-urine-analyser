import { useNavigate } from 'react-router';
import { AuthForm } from '../components/AuthForm';
import { Link } from 'react-router';

export default function SignIn() {
  const navigate = useNavigate();

  const handleSuccess = (accessToken: string, userId: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userId', userId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">HealthTrack AI</h1>
          <p className="text-gray-600">Personalized health insights from your medical reports</p>
        </div>

        <AuthForm mode="signin" onSuccess={handleSuccess} />

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
