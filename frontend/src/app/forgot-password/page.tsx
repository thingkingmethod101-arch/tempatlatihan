'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal mengirim link reset');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg">
      <Link href="/login" className="text-sm text-blue-600 underline mb-3 inline-block">← Kembali ke Login</Link>
      <h1 className="text-xl font-bold mb-4">Lupa Password</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" type="email" placeholder="Email terdaftar"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit" disabled={loading} className="w-full bg-black text-white p-2 rounded disabled:opacity-50">
          {loading ? 'Mengirim...' : 'Kirim Link Reset'}
        </button>
      </form>
      {message && <p className="text-sm mt-3">{message}</p>}
    </div>
  );
}