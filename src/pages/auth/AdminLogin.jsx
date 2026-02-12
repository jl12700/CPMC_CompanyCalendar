import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn, signOut } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await signIn(formData.email, formData.password);
      
      if (authError) {
        setError(authError.message || 'Invalid credentials');
        return;
      }

      // Check if user has admin role
      const isAdmin = data?.user?.user_metadata?.role === 'admin';
      
      if (!isAdmin) {
        // Sign out the non-admin user
        await signOut();
        setError('Access denied. Admin privileges required.');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-500 mt-2">PROD Control - Administrator Login</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <Input 
              label="Admin Email" 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="admin@company.com" 
              required 
              autoFocus 
            />

            <div className="relative">
              <Input 
                label="Password" 
                type={showPassword ? "text" : "password"} 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="Enter your password" 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>

            <Button 
              type="submit" 
              fullWidth 
              disabled={loading} 
              className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
                loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
              }`}
            >
              {loading ? 'Verifying credentials...' : 'Sign in as Admin'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to User Login
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center text-sm text-gray-600">
            Need admin access? <span className="text-gray-500">Contact your system administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;