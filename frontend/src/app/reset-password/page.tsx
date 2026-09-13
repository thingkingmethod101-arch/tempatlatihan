'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Password dan konfirmasi tidak sama');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: { token, newPassword }, auth: false });
      setMessage('Password berhasil diubah! Mengarahkan ke login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg">
      <h1 className="text-xl font-bold mb-4">Atur Password Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full border p-2 rounded" type="password" placeholder="Password baru"
          value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <input className="w-full border p-2 rounded" type="password" placeholder="Ulangi password baru"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        <button type="submit" disabled={loading} className="w-full bg-black text-white p-2 rounded disabled:opacity-50">
          {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
        </button>
      </form>
      {message && <p className="text-sm mt-3">{message}</p>}
    </div>
  );
}