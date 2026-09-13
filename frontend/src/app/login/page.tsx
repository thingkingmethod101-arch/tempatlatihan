'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [kontak, setKontak] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(kontak, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg">
      <h1 className="text-xl font-bold mb-4">Masuk</h1>
      <Link href="/" className="text-sm text-blue-600 underline mb-3 inline-block">← Kembali ke Beranda</Link>      
      <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700 mb-1">Masukkan Nomor WhatsApp</label>
      <input className="w-full border p-2 rounded" placeholder="Masukkan Nomor WhatsApp"
          value={kontak} onChange={(e) => setKontak(e.target.value)} required />
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Masukkan Password/Sandi</label>
          <input className="w-full border p-2 rounded pr-10" type={showPassword ? 'text' : 'password'} placeholder="Password"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {showPassword ? 'Sembunyikan' : 'Lihat'}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="w-full bg-black text-white p-2 rounded disabled:opacity-50">
          {loading ? 'Memproses...' : 'Masuk'}
        </button>

        <p className="text-sm text-center mt-2">
          <Link href="/forgot-password" className="text-blue-600 underline">Lupa Password?</Link>
        </p>

        <p className="text-sm text-center mt-2">
          Belum punya akun?{' '}
          <Link href="/register" className="text-blue-600 underline">Daftar di sini</Link>
        </p>
        
      </form>
    </div>
  );
}