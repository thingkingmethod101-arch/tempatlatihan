'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface UserDetail {
  id: string;
  nama: string;
  kontak: string;
  role: string;
  createdAt: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/users/${params.userId}`).then(setUser).catch((e) => setError(e.message));
  }, [params.userId]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!user) return <p>Memuat...</p>;

  return (
    <div className="max-w-md border rounded p-4">
      <h1 className="text-xl font-bold mb-2">{user.nama}</h1>
      <p className="text-sm text-gray-600">Kontak: {user.kontak}</p>
      <p className="text-sm text-gray-600">Role: {user.role}</p>
      <p className="text-xs text-gray-400 mt-2">Bergabung: {new Date(user.createdAt).toLocaleDateString('id-ID')}</p>
    </div>
  );
}