import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

type Mode = 'login' | 'register';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setRegisterSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Apna naam likhein'); return; }
    if (password.length < 6) { setError('Password kam se kam 6 characters ka hona chahiye'); return; }
    if (password !== confirmPassword) { setError('Dono passwords match nahi kar rahe'); return; }

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); return; }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, name: name.trim(), role: 'viewer' });
      if (profileError) { setError(profileError.message); return; }
    }

    setRegisterSuccess(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-app flex items-center justify-center text-text-secondary font-bold">App chalu ho rahi hai...</div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
        <div className="bg-surface p-8 rounded-3xl shadow-lg border border-border-default max-w-sm w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-text-primary">Nirman Hisaab</h1>
            <p className="text-text-secondary text-sm mt-1">Cloud Sync mein login karein</p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-surface-subdued rounded-2xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'register' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 p-3 rounded-xl text-sm font-bold mb-4">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-4 py-2 bg-surface-subdued text-text-primary placeholder:text-text-subdued border border-border-default rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  placeholder="hisab@nirman.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-2 bg-surface-subdued text-text-primary placeholder:text-text-subdued border border-border-default rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-brand text-white rounded-xl font-bold mt-2 shadow-md shadow-brand/20"
              >
                Login Karein
              </button>
            </form>
          ) : registerSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-text-primary">Account ban gaya!</p>
                <p className="text-sm text-text-secondary mt-1">Email confirm karein, phir login karein.</p>
              </div>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full py-3 bg-brand text-white rounded-xl font-bold shadow-md shadow-brand/20"
              >
                Login pe Jaayein
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase">Naam</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-4 py-2 bg-surface-subdued text-text-primary placeholder:text-text-subdued border border-border-default rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  placeholder="Ramesh Kumar"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-4 py-2 bg-surface-subdued text-text-primary placeholder:text-text-subdued border border-border-default rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  placeholder="hisab@nirman.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-2 bg-surface-subdued text-text-primary placeholder:text-text-subdued border border-border-default rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase">Password Confirm Karein</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full mt-1 px-4 py-2 bg-surface-subdued text-text-primary placeholder:text-text-subdued border border-border-default rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-brand text-white rounded-xl font-bold mt-2 shadow-md shadow-brand/20"
              >
                Register Karein
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
