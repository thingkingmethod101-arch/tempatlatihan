'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function AkunPage() {
  const [nama, setNama] = useState('');
  const [kontak, setKontak] = useState('');
  const [kelas, setKelas] = useState('');
  const [alamat, setAlamat] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/users/me').then((u) => {
      setNama(u.nama ?? '');
      setKontak(u.kontak ?? '');
      setKelas(u.kelas ?? '');
      setAlamat(u.alamat ?? '');
      setRole(u.role ?? '');
    }).catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/users/me', { method: 'PATCH', body: { nama, kontak, kelas: kelas || undefined, alamat } });
      setMessage('Profil berhasil diperbarui.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-4">Akun Saya</h1>
      <form onSubmit={handleSave} className="border rounded p-4 space-y-3">
        <input className="w-full border p-2 rounded" placeholder="Nama"
          value={nama} onChange={(e) => setNama(e.target.value)} required />
        <input className="w-full border p-2 rounded" placeholder="masukkan Nomor WhatsApp"
          value={kontak} onChange={(e) => setKontak(e.target.value)} required />
        {role === 'siswa' && (
          <input className="w-full border p-2 rounded" placeholder="Kelas (contoh: 9A)"
            value={kelas} onChange={(e) => setKelas(e.target.value)} />
        )}
        <textarea className="w-full border p-2 rounded" placeholder="Alamat lengkap sekolah"
          value={alamat} onChange={(e) => setAlamat(e.target.value)} />
        <button type="submit" disabled={saving} className="w-full bg-black text-white p-2 rounded disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
        {message && <p className="text-sm">{message}</p>}
      </form>
    </div>
  );
}