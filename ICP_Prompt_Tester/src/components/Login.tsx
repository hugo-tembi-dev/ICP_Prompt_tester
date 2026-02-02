import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SparklesIcon, EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
      <div className="w-1/2 max-w-md mx-auto" style={{ width: '50%', maxWidth: '448px', margin: '0 auto' }}>
        {/* Logo */}
        <div className="text-center mb-10" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-lg mb-6 shadow-lg" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '6rem', height: '6rem', backgroundColor: 'black', borderRadius: '0.5rem', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <img 
              src="/tembi.png" 
              alt="Tembi Logo" 
              style={{ width: '5rem', height: '5rem', objectFit: 'contain' }}
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2" style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Welcome back</h1>
          <p className="text-base text-gray-600" style={{ fontSize: '1rem', color: '#6b7280' }}>Welcome back! Please enter your details.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-2" style={{ display: 'block', fontSize: '1rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <UserIcon className="h-5 w-5 text-gray-400" style={{ height: '1.25rem', width: '1.25rem', color: '#9ca3af' }} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base shadow-sm"
                  style={{ appearance: 'none', display: 'block', width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', color: '#111827', fontSize: '1rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                  placeholder="Enter your name"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2" style={{ display: 'block', fontSize: '1rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <EnvelopeIcon className="h-5 w-5 text-gray-400" style={{ height: '1.25rem', width: '1.25rem', color: '#9ca3af' }} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base shadow-sm"
                style={{ appearance: 'none', display: 'block', width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', color: '#111827', fontSize: '1rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2" style={{ display: 'block', fontSize: '1rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '1rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <LockClosedIcon className="h-5 w-5 text-gray-400" style={{ height: '1.25rem', width: '1.25rem', color: '#9ca3af' }} />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-base shadow-sm"
                style={{ appearance: 'none', display: 'block', width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.875rem', paddingBottom: '0.875rem', border: '1px solid #d1d5db', borderRadius: '0.75rem', color: '#111827', fontSize: '1rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl" style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem' }}>
              <p className="text-sm text-red-700" style={{ fontSize: '0.875rem', color: '#b91c1c' }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-3.5 px-4 rounded-xl text-base font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            style={{
              width: '100%',
              backgroundColor: 'black',
              color: 'white',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" style={{ animation: 'spin 1s linear infinite', marginLeft: '-0.25rem', marginRight: '0.75rem', height: '1.25rem', width: '1.25rem', color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              isLogin ? 'Sign in' : 'Sign up'
            )}
          </button>
        </form>

        {/* Toggle between Login/Register */}
        <div className="mt-6 text-center" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p className="text-sm text-gray-600" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-medium text-black hover:text-gray-800 transition-colors"
              style={{ fontWeight: 500, color: 'black', transition: 'color 0.2s', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
