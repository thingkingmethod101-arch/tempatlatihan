'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface UserRow { id: string; nama: string; kontak: string; role: string; kelas: string | null; aktif: boolean; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nama: '', kelas: '' });
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    apiFetch(`/users${roleFilter ? `?role=${roleFilter}` : ''}`).then(setUsers).catch((e) => setMessage(e.message));
  }

  useEffect(() => { load(); }, [roleFilter]);

  function startEdit(u: UserRow) {
    setEditingId(u.id);
    setEditForm({ nama: u.nama, kelas: u.kelas ?? '' });
  }

  async function handleSave(id: string) {
    try {
      await apiFetch(`/users/${id}`, { method: 'PATCH', body: editForm });
      setEditingId(null);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal simpan');
    }
  }

  async function handleToggleActive(u: UserRow) {
    const aksi = u.aktif ? 'nonaktifkan' : 'aktifkan';
    if (!confirm(`Yakin mau ${aksi} akun "${u.nama}"?`)) return;
    try {
      await apiFetch(`/users/${u.id}/active`, { method: 'PATCH', body: { aktif: !u.aktif } });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal ubah status');
    }
  }

  async function handleResetPsikotes(u: UserRow) {
    if (!confirm(`Reset jatah tes psikometri gratis untuk "${u.nama}"? Semua hasil tes lama (gratis maupun berbayar) akan terhapus permanen.`)) return;
    try {
      await apiFetch(`/psych-test/admin/reset/${u.id}`, { method: 'DELETE' });
      setMessage(`Jatah psikotes ${u.nama} berhasil direset.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal reset psikotes');
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Kelola Akun</h1>

      <select className="border p-2 rounded mb-4" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
        <option value="">Semua Role</option>
        <option value="siswa">Siswa</option>
        <option value="orang_tua">Orang Tua</option>
        <option value="tutor">Tutor</option>
        <option value="sekolah">Sekolah</option>
        <option value="admin">Admin</option>
      </select>

      {message && <p className="text-sm text-red-600 mb-2">{message}</p>}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="border rounded p-3">
            {editingId === u.id ? (
              <div className="flex gap-2 items-end flex-wrap">
                <input className="border p-1 rounded text-sm" placeholder="Nama"
                  value={editForm.nama} onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })} />
                <input className="border p-1 rounded text-sm" placeholder="Kelas"
                  value={editForm.kelas} onChange={(e) => setEditForm({ ...editForm, kelas: e.target.value })} />
                <button onClick={() => handleSave(u.id)} className="bg-black text-white px-3 py-1 rounded text-sm">Simpan</button>
                <button onClick={() => setEditingId(null)} className="text-sm text-gray-600">Batal</button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{u.nama} {!u.aktif && <span className="text-xs text-red-600">(nonaktif)</span>}</p>
                  <p className="text-xs text-gray-500">{u.kontak} · {u.role} {u.kelas ? `· Kelas ${u.kelas}` : ''}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(u)} className="text-xs text-blue-600 underline">Edit</button>
                  <button onClick={() => handleToggleActive(u)} className={`text-xs underline ${u.aktif ? 'text-red-600' : 'text-green-600'}`}>
                    {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  {u.role === 'siswa' && (
                    <button onClick={() => handleResetPsikotes(u)} className="text-xs text-orange-600 underline">
                      Reset Psikotes
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {users.length === 0 && <p className="text-gray-500 text-sm">Tidak ada akun.</p>}
      </div>
    </div>
  );
}