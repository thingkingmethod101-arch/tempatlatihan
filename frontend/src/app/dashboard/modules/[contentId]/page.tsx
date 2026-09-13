'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';


interface ContentDetail {
  id: string;
  judul: string | null;
  deskripsi: string | null;
  avgRating: number;
  totalRating: number;
  namaPembuat: string;
  nomorKontak: string | null;
  chapters: { id: string; judul: string; isFree: boolean; tipe: string }[];
  pricing: { id: string; durasiBulan: number; harga: string }[];
}

interface Comment {
  id: string;
  isi: string;
  createdAt: string;
  user: { nama: string };
  replies: { id: string; isi: string; user: { nama: string } }[];
}

export default function ModuleDetailPage() {
  const params = useParams();
  const contentId = params.contentId as string;

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [myRating, setMyRating] = useState(0);
  const [buying, setBuying] = useState(false);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [free, setFree] = useState(false);
  const [kodeReferral, setKodeReferral] = useState(() => localStorage.getItem('savedReferralCode') || '');
  const { user } = useAuth();
  const isOwnerOrAdmin = !!user && content && (user.id === (content as any).ownerId || user.role === 'admin');
  const [accessStatus, setAccessStatus] = useState<{ hasBundle: boolean; hasVideo: boolean; hasMateri: boolean } | null>(null);


  function load() {
    apiFetch(`/contents/${contentId}`).then(setContent).catch((e) => setError(e.message));
    apiFetch(`/contents/${contentId}/comments`).then(setComments).catch(() => {});
    apiFetch('/payment-settings').then(async (settings) => {
      if (settings?.qrisFileAssetId) {
        const signed = await apiFetch(`/files/${settings.qrisFileAssetId}/signed-url`);
        setQrisUrl(signed.url ?? null);
      }
    }).catch(() => {});

  }

  useEffect(() => { load(); }, [contentId]);
  useEffect(() => {
    if (user && !isOwnerOrAdmin) {
      apiFetch(`/contents/${contentId}/my-access-status`).then(setAccessStatus).catch(() => {});
    }
  }, [user, contentId, isOwnerOrAdmin]);

  async function handleBuy(pricingId: string) {
    setBuying(true);
    setMessage(null);
    setFree(false);
    try {
      const res = await apiFetch('/transactions', { method: 'POST', body: { contentPricingId: pricingId, kodeReferral: kodeReferral || undefined } });
      if (res.free) {
        setFree(true);
        setMessage('Modul ini gratis/lunas dengan diskon — akses sudah langsung aktif! Cek di menu "Modul Saya".');
      } else {
        setMessage(
          `Pesanan dibuat! Transfer TEPAT Rp${res.totalTransfer.toLocaleString('id-ID')} (kode unik: ${res.kodeUnik}).`
        );
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '';
      const kodeReferralBermasalah =
        errMsg.includes('sudah pernah memakai') ||
        errMsg.includes('tidak aktif') ||
        errMsg.includes('Kuota') ||
        errMsg.includes('tidak ditemukan');

      if (kodeReferralBermasalah && kodeReferral) {
        localStorage.removeItem('savedReferralCode');
        localStorage.removeItem('savedReferralPersen');
        setKodeReferral('');
        try {
          const res2 = await apiFetch('/transactions', { method: 'POST', body: { contentPricingId: pricingId } });
          if (res2.free) {
            setFree(true);
            setMessage('Modul ini gratis — akses sudah langsung aktif! Cek di menu "Modul Saya".');
          } else {
            setMessage(
              `Kode referral yang tersimpan sudah tidak berlaku, jadi dipakai harga normal. Transfer TEPAT Rp${res2.totalTransfer.toLocaleString('id-ID')} (kode unik: ${res2.kodeUnik}).`
            );
          }
        } catch (e2) {
          setMessage(e2 instanceof Error ? e2.message : 'Gagal checkout');
        }
      } else {
        setMessage(errMsg || 'Gagal checkout');
      }
    } finally {
      setBuying(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await apiFetch(`/contents/${contentId}/comments`, { method: 'POST', body: { isi: newComment } });
      setNewComment('');
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal kirim komentar');
    }
  }

  async function handleRate(bintang: number) {
    setMyRating(bintang);
    try {
      await apiFetch(`/contents/${contentId}/rating`, { method: 'POST', body: { bintang } });
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Gagal memberi rating');
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!content) return <p>Memuat...</p>;

  return (
    <div className="max-w-2xl">
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{content.judul || 'Modul Tanpa Judul'}</h1>
      <p style={{ fontSize: 12.5, color: '#6B7C93', marginBottom: 8 }}>{content.chapters.length} Bab</p>

      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= Math.round(content.avgRating) ? 'text-yellow-500' : 'text-gray-300'}>★</span>
        ))}
        <span className="text-sm text-gray-500 ml-1">{content.avgRating} ({content.totalRating} rating)</span>
      </div>

      <p className="text-gray-700 mb-4">{content.deskripsi || 'Tidak ada deskripsi.'}</p>

      <div className="border rounded p-4 mb-4">
        <p className="font-semibold mb-1">Dibuat oleh: {content.namaPembuat}</p>
        {content.nomorKontak && (
          <p className="text-sm text-gray-600">Kontak: {content.nomorKontak}</p>
        )}
      </div>

      <div className="border rounded p-4 mb-4">
        <h2 className="font-semibold mb-2">Daftar Bab</h2>
        {content.chapters.map((ch) => (
          <div key={ch.id} className="flex justify-between items-center py-1">
            <p className="text-sm text-gray-700">{ch.judul}</p>
            {ch.tipe === 'viewer_pdf' && (
              <button
                onClick={async () => {
                  try {
                    const res = await apiFetch(`/contents/chapters/${ch.id}/preview`);
                    if (res.pdfUrl) window.open(res.pdfUrl, '_blank');
                  } catch (e) {
                    alert('Gagal membuka preview');
                  }
                }}
                className="text-xs text-blue-600 underline bg-transparent border-none cursor-pointer p-0"
              >
                Lihat Preview (5 Halaman)
              </button>
            )}
          </div>
        ))}
      </div>

      {isOwnerOrAdmin ? (
        <div className="border rounded p-4 mb-4 bg-blue-50">
          <p className="text-sm mb-2">Ini modul milikmu — kamu bisa buka langsung tanpa membeli.</p>
          <Link href={`/dashboard/my-modules/${content.id}`} className="bg-black text-white px-4 py-2 rounded text-sm inline-block">
            Buka Modul
          </Link>
        </div>
      ) : (
        <div className="border rounded p-4 mb-4">
          <h2 className="font-semibold mb-2">Pilih Paket</h2>
          {content.pricing.map((p: any) => {
          const sudahPunya =
            p.paket === 'bundle' ? accessStatus?.hasBundle :
            p.paket === 'video' ? accessStatus?.hasVideo :
            p.paket === 'materi' ? accessStatus?.hasMateri :
            accessStatus?.hasBundle;

          return (
            <div key={p.id} className="flex justify-between items-center mb-2 border-b pb-2">
              <div>
                <span className="font-medium">
                  {p.paket === 'video' ? 'Video Saja' : p.paket === 'materi' ? 'Materi (PDF+Soal)' : p.paket === 'bundle' ? 'Bundle (Semua)' : `${p.durasiBulan} bulan`}
                </span>
                <p className="text-xs text-gray-500">
                  {Number(p.harga) <= 0 ? 'Gratis' : `Rp${Number(p.harga).toLocaleString('id-ID')}`} · {p.durasiBulan} bulan
                </p>
              </div>
              {sudahPunya ? (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded font-medium">Sudah Dimiliki cek konten di menu Modul Saya</span>
              ) : (
                <button
                  disabled={buying}
                  onClick={() => handleBuy(p.id)}
                  className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                >
                  {buying ? 'Memproses...' : Number(p.harga) <= 0 ? 'Ambil Gratis' : 'Beli'}
                </button>
              )}
            </div>
          );
        })}
        </div>
      )}
      {message && (
        <div className="border rounded p-4 mb-4">
          <p className="text-sm mb-3">{message}</p>

          {!free && (
            <>
              {qrisUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrisUrl} alt="QRIS Pembayaran" className="w-48 mx-auto mb-3 border rounded" />
              )}
              <a
                href={`https://wa.me/6282322196419?text=${encodeURIComponent('Halo Admin, saya sudah transfer untuk pembelian modul, mohon dicek dan dikonfirmasi. Terima kasih.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-green-600 text-white py-2 rounded text-sm mb-2"
              >
                💬 Konfirmasi via WhatsApp
              </a>
              <Link href="/dashboard/transactions" className="block text-center bg-black text-white py-2 rounded text-sm">
                Proses → Lihat di Transaksi Saya
              </Link>
            </>
          )}
        </div>
      )}
      
      <div className="border rounded p-4 mb-4">
        <h2 className="font-semibold mb-2">Beri Rating</h2>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => handleRate(n)} className="text-2xl">
              <span className={n <= myRating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-3">Komentar</h2>
        <form onSubmit={handleComment} className="flex gap-2 mb-4">
          <input className="flex-1 border p-2 rounded text-sm" placeholder="Tulis komentar..."
            value={newComment} onChange={(e) => setNewComment(e.target.value)} />
          <button type="submit" className="bg-black text-white px-3 py-1 rounded text-sm">Kirim</button>
        </form>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="border-b pb-2">
              <p className="text-sm font-medium">{c.user.nama}</p>
              <p className="text-sm text-gray-700">{c.isi}</p>
              {c.replies.length > 0 && (
                <div className="ml-4 mt-1 space-y-1">
                  {c.replies.map((r) => (
                    <div key={r.id}>
                      <p className="text-xs font-medium">{r.user.nama}</p>
                      <p className="text-xs text-gray-600">{r.isi}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {comments.length === 0 && <p className="text-gray-500 text-sm">Belum ada komentar.</p>}
        </div>
      </div>
    </div>
  );
}