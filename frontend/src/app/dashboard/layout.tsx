'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import styles from './dashboard.module.css';

interface NavItem { href: string; label: string; }
interface NavGroup { label: string; items: NavItem[]; }

function NavDropdown({ group, openGroup, setOpenGroup }: { group: NavGroup; openGroup: string | null; setOpenGroup: (g: string | null) => void }) {
  const isOpen = openGroup === group.label;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  function handleToggle() {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, left: rect.left });
    }
    setOpenGroup(isOpen ? null : group.label);
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={styles.navLink}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {group.label}
        <span style={{ fontSize: 10 }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'fixed', top: coords.top, left: coords.left,
            background: '#12325C', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, minWidth: 200, zIndex: 9999, boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          }}
        >
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpenGroup(null)}
              style={{
                display: 'block', padding: '10px 14px', fontSize: 13, color: '#fff',
                textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileMenu({ groups, showKembaliKeLanding, onClose }: { groups: NavGroup[]; showKembaliKeLanding: boolean; onClose: () => void }) {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, width: 280, maxWidth: '85vw', height: '100%',
        background: '#12325C', zIndex: 201, overflowY: 'auto',
        padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <button onClick={onClose} style={{
          alignSelf: 'flex-end', background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', marginBottom: 8,
        }}>✕</button>

        {groups.map((group) => {
          const isOpen = openAccordion === group.label;
          return (
            <div key={group.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setOpenAccordion(isOpen ? null : group.label)}
                style={{
                  width: '100%', background: 'none', border: 'none', color: '#fff',
                  fontSize: 15, fontWeight: 700, padding: '12px 4px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                }}
              >
                {group.label}
                <span style={{ fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 8 }}>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      style={{
                        color: 'rgba(255,255,255,0.85)', fontSize: 14, textDecoration: 'none',
                        padding: '8px 16px',
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {showKembaliKeLanding && (
          <Link
            href="/"
            onClick={onClose}
            style={{
              color: 'rgba(255,255,255,0.85)', fontSize: 14, textDecoration: 'none',
              padding: '12px 4px', marginTop: 8,
            }}
          >
            ← Kembali ke Landing
          </Link>
        )}
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  useEffect(() => {
    function checkWidth() {
      setIsMobile(window.innerWidth <= 768);
    }
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading || !user) return <p style={{ padding: 24 }}>Memuat...</p>;

  const siswaGroups: NavGroup[] = [
    {
      label: 'Belajar',
      items: [
        { href: '/dashboard/events', label: 'Event' },
        { href: '/dashboard/modules', label: 'Modul' },
        { href: '/dashboard/my-modules', label: 'Modul Saya' },
        { href: '/dashboard/riwayat-event', label: 'Riwayat Event' },
      ],
    },
    {
      label: 'Pengembangan Diri',
      items: [
        { href: '/dashboard/talent', label: 'Talenta' },
        { href: '/dashboard/psych-test', label: 'Tes Psikometri' },
        { href: '/dashboard/certificates', label: 'Sertifikat' },
        { href: '/dashboard/scholarships', label: 'Beasiswa' },
      ],
    },
    {
      label: 'Akun',
      items: [
        { href: '/dashboard/transactions', label: 'Transaksi' },
        { href: '/dashboard/parent-requests', label: 'Permintaan Ortu' },
        { href: '/dashboard/akun', label: 'Akun Saya' },
      ],
    },
  ];

  const orangTuaGroups: NavGroup[] = [
    {
      label: 'Menu',
      items: [
        { href: '/dashboard/parent-links', label: 'Anak Saya' },
        { href: '/dashboard/modules', label: 'Modul' },
        { href: '/dashboard/transactions', label: 'Transaksi' },
        { href: '/dashboard/akun', label: 'Akun Saya' },
      ],
    },
  ];

  const tutorGroups: NavGroup[] = [
    {
      label: 'Konten',
      items: [
        { href: '/dashboard/my-content', label: 'Konten Saya' },
        { href: '/dashboard/my-questions', label: 'Soal Saya' },
        { href: '/dashboard/modules', label: 'Lihat Modul' },
        { href: '/dashboard/siswa-saya', label: 'Siswa Saya' },
      ],
    },
    {
      label: 'Penghasilan',
      items: [
        { href: '/dashboard/royalties', label: 'Royalti' },
        { href: '/dashboard/royalties-detail', label: 'Detail Penjualan' },
      ],
    },
    {
      label: 'Akun',
      items: [
        { href: '/dashboard/profile', label: 'Profil' },
        { href: '/dashboard/akun', label: 'Akun Saya' },
      ],
    },
  ];

  const adminGroups: NavGroup[] = [
    {
      label: 'Moderasi',
      items: [
        { href: '/dashboard/admin/tutors', label: 'Verifikasi Tutor' },
        { href: '/dashboard/admin/questions', label: 'Moderasi Soal' },
        { href: '/dashboard/admin/content', label: 'Moderasi Konten' },
        { href: '/dashboard/admin/delete-requests', label: 'Permohonan Hapus' },
      ],
    },
    {
      label: 'Event & Belajar',
      items: [
        { href: '/dashboard/admin/events', label: 'Kelola Event' },
        { href: '/dashboard/admin/skill-nodes', label: 'Skill Node' },
        { href: '/dashboard/admin/tier-configs', label: 'Tier' },
        { href: '/dashboard/admin/talent', label: 'Pemetaan Talenta' },
        { href: '/dashboard/admin/psych-test', label: 'Tes Psikometri' },
        { href: '/dashboard/admin/riasec-mapping', label: 'Kombinasi RIASEC' },
        { href: '/dashboard/admin/tutor-siswa', label: 'Hubungkan Tutor-Siswa' },
      ],
    },
    {
      label: 'Konten',
      items: [
        { href: '/dashboard/modules', label: 'Lihat Modul' },
        { href: '/dashboard/my-content', label: 'Buat Modul' },
        { href: '/dashboard/my-questions', label: 'Buat Soal' },
      ],
    },
    {
      label: 'Keuangan',
      items: [
        { href: '/dashboard/admin/transactions', label: 'Transaksi' },
        { href: '/dashboard/admin/royalties', label: 'Royalti' },
        { href: '/dashboard/admin/pembukuan', label: 'Pembukuan' },
        { href: '/dashboard/admin/payment-settings', label: 'QRIS' },
        { href: '/dashboard/admin/referral', label: 'Kode Referral' },
        { href: '/dashboard/admin/psych-test-settings', label: 'Harga Tes Psikometri' },
      ],
    },
    {
      label: 'Situs',
      items: [
        { href: '/dashboard/admin/announcements', label: 'Pengumuman' },
        { href: '/dashboard/admin/berita', label: 'Berita' },
        { href: '/dashboard/admin/landing-settings', label: 'Gambar Landing' },
        { href: '/dashboard/admin/scholarships', label: 'Beasiswa' },
      ],
    },
    {
      label: 'Sistem',
      items: [
        { href: '/dashboard/admin/users', label: 'Kelola Akun' },
        { href: '/dashboard/admin/backup', label: 'Backup' },
        { href: '/dashboard/akun', label: 'Akun Saya' },
      ],
    },
  ];

  const groups =
    user.role === 'siswa' ? siswaGroups :
    user.role === 'orang_tua' ? orangTuaGroups :
    user.role === 'tutor' ? tutorGroups :
    user.role === 'admin' ? adminGroups : [];

  return (
    <div className={styles.page}>
      <nav className={styles.nav} ref={navRef}>
        <Link href="/dashboard" className={styles.navBrand}>TempatLatihan.com</Link>

        {!isMobile && groups.map((group) => (
          <NavDropdown key={group.label} group={group} openGroup={openGroup} setOpenGroup={setOpenGroup} />
        ))}

        <div className={styles.navUser}>
          {!isMobile && (
            <div className={styles.navUserInfo}>
              <b>{user.kontak}</b>
              {user.role}
            </div>
          )}
          {user.role !== 'admin' && !isMobile && (
            <Link href="/" style={{ fontSize: 13, color: '#fff', marginRight: 12 }}>
              ← Kembali ke Landing
            </Link>
          )}
          {!isMobile && (
            <button onClick={async () => { await logout(); router.push('/'); }} className={styles.logoutBtn}>
              Logout
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu"
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                padding: '8px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              ☰ Klik untuk Menu!
            </button>
          )}
        </div>
      </nav>

      {isMobile && mobileMenuOpen && (
        <MobileMenu
          groups={groups}
          showKembaliKeLanding={user.role !== 'admin'}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {isMobile && mobileMenuOpen && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 202 }}>
          <button
            onClick={async () => { await logout(); router.push('/'); }}
            style={{
              background: '#EF4444', color: '#fff', border: 'none', borderRadius: 20,
              padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      )}

      <main className={styles.main}>{children}</main>
    </div>
  );
}
