"use client";
export const dynamic = "force-dynamic";
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "@/lib/auth";


export default function LoginPage() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password);
      window.location.href = '/dashboard';
    } catch (e:any) { alert(e.message); } finally { setLoading(false); }
  }

  return (
    <main className="p-6 max-w-md mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={login} className="space-y-3">
        <input className="w-full p-2 rounded" placeholder="Email" type="email"
               value={email} onChange={e=>setEmail(e.target.value)}/>
        <input className="w-full p-2 rounded" placeholder="Password" type="password"
               value={password} onChange={e=>setPassword(e.target.value)}/>
        <button disabled={loading} className="px-4 py-2 rounded bg-blue-600">
          {loading ? 'נכנס…' : 'Login'}
        </button>
      </form>
      <p className="opacity-70">אין משתמש? <a className="underline" href="/signup">להרשמה</a></p>
    </main>
  );
}

