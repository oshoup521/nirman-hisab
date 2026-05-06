import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
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

          {error && (
            <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 p-3 rounded-xl text-sm font-bold mb-4">
              {error}
            </div>
          )}

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
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
