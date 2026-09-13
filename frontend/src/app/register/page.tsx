'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    nama: '', kontak: '', password: '', role: 'siswa',
    jenisKelamin: 'L', tanggalLahir: '', alamat: '', email: '',
    namaLengkap: '', jenjangPendidikanTerakhir: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [setuju, setSetuju] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }
    if (!setuju) {
      setError('Kamu harus menyetujui Syarat & Ketentuan terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nama: form.nama,
        kontak: form.kontak,
        password: form.password,
        role: form.role,
        jenisKelamin: form.jenisKelamin,
        tanggalLahir: form.tanggalLahir,
        alamat: form.alamat,
        email: form.email,
        setujuSyaratKetentuan: setuju
      };
      if (form.role === 'tutor') {
        payload.namaLengkap = form.namaLengkap;
        payload.jenjangPendidikanTerakhir = form.jenjangPendidikanTerakhir;
      }
      await register(payload);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  }

  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const inputClass = "w-full border p-2 rounded";

  return (
    <div className="max-w-md mx-auto mt-16 p-6 border rounded-lg">
      <Link href="/" className="text-sm text-blue-600 underline mb-3 inline-block">← Kembali ke Beranda</Link>
      <h1 className="text-xl font-bold mb-4">Daftar Akun</h1>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className={labelClass}>Nama Lengkap</label>
          <input className={inputClass} placeholder="Contoh: Budi Santoso"
            value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        </div>

        <div>
          <label className={labelClass}>Nomor WhatsApp</label>
          <input className={inputClass} placeholder="Contoh: 081234567890"
            value={form.kontak} onChange={(e) => setForm({ ...form, kontak: e.target.value })} required />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} type="email" placeholder="Untuk pemulihan password"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <div className="relative">
            <input
              className={inputClass + " pr-16"}
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600"
            >
              {showPassword ? 'Sembunyikan' : 'Lihat'}
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>Ulangi Password</label>
          <input
            className={inputClass}
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan ulang password yang sama"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Daftar Sebagai</label>
          <select className={inputClass}
            value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="siswa">Siswa</option>
            <option value="orang_tua">Orang Tua</option>
            <option value="tutor">Tutor</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelClass}>Jenis Kelamin</label>
            <select className={inputClass}
              value={form.jenisKelamin} onChange={(e) => setForm({ ...form, jenisKelamin: e.target.value })} required>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Tanggal Lahir</label>
            <input type="date" className={inputClass}
              value={form.tanggalLahir} onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })} required />
          </div>
        </div>

        <div>
          <label className={labelClass}>Alamat Lengkap Sekolah</label>
          <textarea className={inputClass} placeholder="Alamat Lengkap sekolah untuk pengiriman piala/sertifikat fisik. Jika kesulitan hubungi admin!"
            value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} required />
        </div>

        {form.role === 'tutor' && (
          <>
            <div>
              <label className={labelClass}>Nama Akun Tutor</label>
              <input className={inputClass} placeholder="Nama yang tampil di profil tutor"
                value={form.namaLengkap} onChange={(e) => setForm({ ...form, namaLengkap: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Jenjang Pendidikan Terakhir</label>
              <input className={inputClass} placeholder="Contoh: S1"
                value={form.jenjangPendidikanTerakhir}
                onChange={(e) => setForm({ ...form, jenjangPendidikanTerakhir: e.target.value })} required />
            </div>
          </>
        )}

        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)}
            className="mt-0.5" required />
          <span>
            Saya menyetujui{' '}
            <Link href="/syarat-ketentuan" target="_blank" className="text-blue-600 underline">
              Syarat & Ketentuan serta Kebijakan Privasi
            </Link>{' '}
            Tempat Latihan.com
          </span>
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-black text-white p-2 rounded disabled:opacity-50">
          {loading ? 'Memproses...' : 'Daftar'}
        </button>
      </form>
    </div>
  );
}