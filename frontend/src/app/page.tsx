'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import styles from './landing.module.css';

const RIASEC = [
  { l: 'R', n: 'Realistic' }, { l: 'I', n: 'Investigative' }, { l: 'A', n: 'Artistic' },
  { l: 'S', n: 'Social' }, { l: 'E', n: 'Enterprising' }, { l: 'C', n: 'Conventional' },
];

const ICON_CLASSES = ['icPink', 'icBlue', 'icPurple', 'icTeal', 'icOrange'];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('beranda');
  const { user } = useAuth();
  const router = useRouter();

  function goToProtected(path: string) {
    router.push(user ? path : '/login');
  }
  const [events, setEvents] = useState<{ id: string; nama: string; tipe: string; jenjang: string }[]>([]);
  const [berita, setBerita] = useState<{ id: string; judul: string; tag: string | null; isi: string; gambarUrl: string | null; createdAt: string }[]>([]);
  const [landingImages, setLandingImages] = useState<{ heroImageUrl: string | null; testImageUrl: string | null; galleryImageUrl: string | null } | null>(null);


  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/events`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setEvents(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/berita`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setBerita(data.slice(0, 4)); })
      .catch(() => {});

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/landing-settings`)
      .then((res) => res.json())
      .then(setLandingImages)
      .catch(() => {});
  }, []);

  function handleNavClick(id: string) {
    setActive(id);
    setMenuOpen(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.frame}>

        <div className={styles.hero} id="beranda">
          <header className={styles.header} style={{ position: 'relative', zIndex: 100 }}>
            <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="TempatLatihan.com" style={{ height: 150 }} />
            </div>

            <nav className={styles.desktopNav}>
              <a className={styles.desktopNavLink} href="#olimpiade" onClick={() => handleNavClick('olimpiade')}>Olimpiade</a>
              <a className={styles.desktopNavLink} href="#tespotensi" onClick={() => handleNavClick('tespotensi')}>Tes Potensi</a>
              <a className={styles.desktopNavLink} href="#berita" onClick={() => handleNavClick('berita')}>Berita</a>
              <a className={styles.desktopNavLink} href="#tentang" onClick={() => handleNavClick('tentang')}>Tentang Kami</a>
              <a className={styles.desktopNavLink} href="#tentang" onClick={() => handleNavClick('tentang')}>Kontak</a>
              <Link href="/login" className={styles.authBtn}>Masuk / Daftar</Link>
            </nav>

            <button 
              onClick={() => setMenuOpen(true)}
              aria-label="Buka menu"
              style={{
                position: 'relative', zIndex: 999, pointerEvents: 'auto',
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: 18, fontWeight: 700, whiteSpace: 'nowrap',
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              }}
            >☰ Klik untuk Menu!</button>
          </header>

          <div className={styles.heroGrid}>
            <div className={styles.heroCaption}>
              <div className={styles.heroEyebrow}>OLIMPIADE SD · SMP · SMA</div>
              <h1>Temukan Potensi, Raih Prestasi, <em>Jadi Juara!</em></h1>
              <p>Platform lomba berbasis soal olimpiade tingkat nasional untuk mempersiapkan generasi masa depan — dilengkapi tes potensi untuk membantu memetakan kekuatan siswa.</p>
              <div className={styles.btnRow}>
                <a className={styles.btnPrimary} href="#olimpiade" onClick={() => handleNavClick('olimpiade')}>Lihat Olimpiade →</a>
                <a className={styles.btnGhost} href="#tentang" onClick={() => handleNavClick('tentang')}>▶ Tentang Kami</a>
              </div>
            </div>

            <div className={styles.heroImageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={landingImages?.heroImageUrl || '/backround_xxx.png'} alt="Siswa berprestasi memegang piala" className={styles.heroImage} />
              <div className={styles.heroFloatCard}>
                <div className={styles.avatarStack}>
                  <span style={{ background: '#FDBA74' }}></span>
                  <span style={{ background: '#93C5FD' }}></span>
                  <span style={{ background: '#6EE7B7' }}></span>
                </div>
                <div>
                  <div className={styles.num}>10.000+</div>
                  <div className={styles.lbl}>Siswa Berprestasi</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.statbar}>
          <div className={styles.item}><div className={styles.num}>100+</div><div className={styles.lbl}>Olimpiade<br />Tersedia</div></div>
          <div className={styles.item}><div className={styles.num}>50.000+</div><div className={styles.lbl}>Peserta<br />Aktif</div></div>
          <div className={styles.item}><div className={styles.num}>1.000+</div><div className={styles.lbl}>Sekolah<br />Bermitra</div></div>
          <div className={styles.item}><div className={styles.num}>95%</div><div className={styles.lbl}>Puas dengan<br />Layanan</div></div>
        </div>

        <div className={styles.section} id="olimpiade">
          <div className={styles.sectionHead}><h2>Daftar Event Lomba</h2></div>
          <p className={styles.sectionSub}>Ikuti berbagai event lomba yang sedang berlangsung!</p>
          <div className={styles.grid2}>
            {events.map((ev, i) => (
              <div
                key={ev.id}
                className={styles.catCard}
                onClick={() => goToProtected('/dashboard/events')}
                style={{ cursor: 'pointer' }}
              >
                <div className={`${styles.ic} ${styles[ICON_CLASSES[i % ICON_CLASSES.length]]}`}>🏆</div>
                <div className={styles.title}>{ev.nama}</div>
                <div className={styles.desc}>{ev.tipe}</div>
                <div className={styles.lvl}>Jenjang {ev.jenjang}</div>
                <div className={styles.arrowBtn}>→</div>
              </div>
            ))}
            {events.length === 0 && <p style={{ color: '#6B7C93', gridColumn: '1/-1' }}>Belum ada event yang dipublikasikan.</p>}
          </div>
        </div>

        <div className={styles.testWrap} id="tespotensi">
        <div className={styles.riasecRow}>
            {RIASEC.map((item) => (
              <div key={item.l} className={styles.riasecItem}>
                <div className={styles.r} style={{ fontSize: 30, width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.l}
                </div>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{item.n}</span>
              </div>
            ))}
          </div>
          <div className={styles.testCard}>
            <div className={styles.testBadges}>
              <span className={styles.testBadgeFree}>GRATIS</span>
              <span className={styles.testBadgeTime}>⏱ &lt; 5 Menit</span>
            </div>
            <div className={styles.testGrid}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={landingImages?.testImageUrl || '/berpikir.png'} alt="Siswa memikirkan potensinya" className={styles.testImage} />
              <div>
                <h3>Belum tahu potensimu di mana?</h3>
                <p>Tes ini menggunakan pendekatan RIASEC (Holland Code) untuk memetakan kecenderungan minat dan gaya belajarmu, hanya dalam waktu kurang dari 10 menit.</p>
                <Link href={user ? '/dashboard/psych-test' : '/login'} className={styles.btnPrimaryFull}>Coba Tes Potensi — Gratis</Link>
                <div className={styles.disclaimerText}>
                  Hasil tes ini bersifat indikatif sebagai gambaran awal untuk mengenali potensi diri, bukan diagnosis psikologis resmi. Untuk pemahaman lebih mendalam, tetap disarankan konsultasi dengan guru BK atau psikolog profesional.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section} id="berita">
          <div className={styles.sectionHead}><h2>Berita &amp; kolaborasi</h2></div>
          {berita.map((b) => (
            <div
              key={b.id}
              className={styles.newsCard}
              onClick={() => goToProtected('/dashboard/berita')}
              style={{ cursor: 'pointer' }}
            >
              {b.gambarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.gambarUrl} alt={b.judul} className={styles.ph} style={{ objectFit: 'cover' }} />
              ) : (
                <div className={styles.ph}></div>
              )}
              <div className={styles.body}>
                {b.tag && <div className={styles.tag}>{b.tag}</div>}
                <div className={styles.newsTitle}>{b.judul}</div>
                <div className={styles.date}>{new Date(b.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
          ))}
          {berita.length === 0 && <p style={{ fontSize: 13, color: '#6B7C93' }}>Belum ada berita.</p>}
        </div>

        <div className={styles.section} id="galeri">
          <div className={styles.sectionHead}><h2>Galeri & Testimoni</h2></div>
          <p style={{ fontSize: 15, color: '#6B7C93', marginBottom: 16 }}>
            Kebanggaan peserta yang sudah meraih prestasi bersama kami.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={landingImages?.galleryImageUrl || '/pegang%20piala.PNG'}
              alt="Peserta memegang piala kemenangan"
              style={{ width: '100%', maxWidth: 420, borderRadius: 12, border: '1px solid #EEF2F6' }}
            />
          </div>
        </div>

        <div className={styles.section} id="faq">
          <div className={styles.sectionHead}><h2>Pertanyaan yang Sering Ditanyakan</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13.5 }}>Apa itu TempatLatihan.com?</p>
              <p style={{ fontSize: 15.5, color: '#6B7C93' }}>
                Platform lomba berbasis soal olimpiade untuk siswa SD, SMP, dan SMA, dilengkapi tes potensi (RIASEC) untuk membantu mengenali kekuatan belajarmu.
              </p>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13.5 }}>Apakah mendaftar akun berbayar?</p>
              <p style={{ fontSize: 15.5, color: '#6B7C93' }}>
                Tidak, mendaftar akun sepenuhnya gratis. Biasanya cuma babak tertentu (misalnya babak final) yang berbayar — babak penyisihan umumnya gratis.
              </p>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13.5 }}>Bagaimana cara pembayarannya?</p>
              <p style={{ fontSize: 15.5, color: '#6B7C93' }}>
                Transfer manual lewat QRIS dengan kode unik 3 digit yang otomatis diberikan sistem, lalu dikonfirmasi oleh admin.
              </p>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13.5 }}>Apakah dapat sertifikat?</p>
              <p style={{ fontSize: 15.5, color: '#6B7C93' }}>
                Ya, peserta yang menyelesaikan babak final mendapat sertifikat digital otomatis yang bisa langsung dicetak/diunduh.
              </p>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13.5 }}>Bagaimana kalau lupa jadwal ujian?</p>
              <p style={{ fontSize: 15.5, color: '#6B7C93' }}>
                Untuk babak yang memakai sistem penjadwalan, info jam ujianmu dikirim langsung secara pribadi lewat WhatsApp oleh admin.
              </p>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 13.5 }}>Apakah hasil tes potensi itu diagnosis psikologis resmi?</p>
              <p style={{ fontSize: 15.5, color: '#6B7C93' }}>
                Bukan. Hasilnya bersifat indikatif sebagai gambaran awal — untuk pemahaman lebih dalam, tetap disarankan konsultasi ke guru BK atau psikolog profesional.
              </p>
            </div>

            
          </div>
        </div>

        <div className={styles.section} id="peraturan">
          <div className={styles.sectionHead}><h2>Peraturan Olimpiade</h2></div>
          <p style={{ fontSize: 15.5, color: '#6B7C93', marginBottom: 16 }}>
            Ketentuan yang berlaku untuk menjamin kejujuran dan keadilan setiap peserta.
          </p>
          <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Peserta wajib hadir minimal 30 menit sebelum lomba dimulai untuk registrasi dan network test.',
              'Pakaian bebas rapi namun diharapkan baju seragam.',
              'Peserta dilarang membawa kalkulator atau alat hitung lain, dan hanya diizinkan kertas untuk bantuan menghitung.',
              'Waktu pengerjaan soal (25 menit untuk Matematika, 20 menit untuk mapel lain). Timer akan mengunci jawaban secara otomatis setelah waktu habis.',
              'Peserta dilarang bekerja sama, bertukar jawaban, atau melakukan tindakan yang mengarah pada kecurangan.',
              'Peserta yang terlambat lebih dari waktu yang ditentukan tidak diperkenankan mengikuti lomba, kecuali atas kebijakan panitia.',
              'Selama lomba berlangsung, peserta tidak diperbolehkan meninggalkan ruangan tanpa izin pengawas.',
              'Keputusan dewan juri dan panitia bersifat final serta tidak dapat diganggu gugat.',
              'Peserta yang melanggar tata tertib dapat dikenai sanksi berupa peringatan hingga diskualifikasi.',
              'Juara ditentukan berdasarkan nilai tertinggi. Jika terjadi nilai yang sama, pemenang ditentukan berdasarkan waktu penyelesaian tercepat atau soal tie-break sesuai ketentuan panitia.',
            ].map((rule, i) => (
              <li key={i} style={{ fontSize: 15.5, color: '#333', lineHeight: 1.6 }}>{rule}</li>
            ))}
          </ol>
        </div>

        <div className={styles.closing} id="tentang">
          <div className={styles.sectionHead}><h2>Tentang TempatLatihan.com</h2></div>

          <p style={{ fontSize: 13.5, color: '#333', lineHeight: 1.75, marginBottom: 20 }}>
            TempatLatihan.com adalah inisiatif pendidikan yang berfokus pada penyelenggaraan kompetisi
            akademik (olimpiade) dan pengembangan potensi diri untuk siswa jenjang SD, SMP, dan SMA di
            Indonesia. Kami percaya setiap anak punya kekuatan uniknya masing-masing - tugas kami adalah
            membantu menemukan dan mengasahnya lewat kompetisi yang sehat, materi belajar yang relevan,
            dan pemetaan potensi yang berbasis data.
          </p>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 20 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#12325C' }}>Visi</p>
              <p style={{ fontSize: 13, color: '#6B7C93', lineHeight: 1.6 }}>
                Menjadi platform terpercaya yang membantu siswa Indonesia menemukan potensi terbaiknya
                dan meraih prestasi akademik secara berkelanjutan.
              </p>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#12325C' }}>Misi</p>
              <ul style={{ fontSize: 13, color: '#6B7C93', lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
                <li>Menyelenggarakan kompetisi olimpiade yang adil, aman, dan terstruktur</li>
                <li>Menyediakan modul belajar yang relevan dengan kebutuhan siswa</li>
                <li>Membantu siswa mengenali potensi dan gaya belajarnya lewat tes psikometri</li>
                <li>Mendukung akses pendidikan lewat program beasiswa</li>
              </ul>
            </div>
          </div>

          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#12325C' }}>Program Kerja Kami</p>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
            <div className={styles.card} style={{ padding: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 13 }}>Olimpiade Berjenjang</p>
              <p style={{ fontSize: 12, color: '#6B7C93', marginTop: 4 }}>Kompetisi berbasis soal olimpiade dengan babak bertingkat dan sertifikat resmi.</p>
            </div>
            <div className={styles.card} style={{ padding: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 13 }}>Tes Potensi (RIASEC)</p>
              <p style={{ fontSize: 12, color: '#6B7C93', marginTop: 4 }}>Pemetaan minat dan gaya belajar berbasis pendekatan psikologi karier yang teruji.</p>
            </div>
            <div className={styles.card} style={{ padding: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 13 }}>Modul Belajar</p>
              <p style={{ fontSize: 12, color: '#6B7C93', marginTop: 4 }}>Materi dan latihan soal dari tutor terverifikasi, disusun sesuai kebutuhan siswa.</p>
            </div>
            <div className={styles.card} style={{ padding: 14 }}>
              <p style={{ fontWeight: 700, fontSize: 13 }}>Program Beasiswa</p>
              <p style={{ fontSize: 12, color: '#6B7C93', marginTop: 4 }}>Dukungan bagi siswa berprestasi maupun yang membutuhkan bantuan biaya pendidikan.</p>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #DCE7F2', borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 11.5, color: '#6B7C93', lineHeight: 1.6 }}>
              <b>Disclaimer:</b> TempatLatihan.com adalah platform pendidikan swasta yang menyelenggarakan
              kompetisi dan program pengembangan potensi secara independen. Hasil tes potensi yang disediakan
              bersifat indikatif sebagai alat bantu pengenalan diri, bukan diagnosis psikologis resmi. Untuk
              kebutuhan konsultasi psikologis mendalam, disarankan menghubungi psikolog atau konselor pendidikan
              berlisensi.
            </p>
          </div>
          <div className={styles.closingActions}>
            <Link href="/register" className={styles.btnPrimaryFull} style={{ width: 'auto', padding: '14px 32px' }}>Daftar Sekarang</Link>
            <Link href="/login" className={styles.btnGhostDark}>Sudah Punya Akun? Masuk</Link>
          </div>
        </div>

        <div className={styles.bottomNav}>
          <a href="#beranda" className={`${styles.navItem} ${active === 'beranda' ? styles.active : ''}`} onClick={() => handleNavClick('beranda')}><span className={styles.navDot}>●</span>Beranda</a>
          <a href="#olimpiade" className={`${styles.navItem} ${active === 'olimpiade' ? styles.active : ''}`} onClick={() => handleNavClick('olimpiade')}><span className={styles.navDot}>🏆</span>Olimpiade</a>
          <a href="#tespotensi" className={`${styles.navItem} ${active === 'tespotensi' ? styles.active : ''}`} onClick={() => handleNavClick('tespotensi')}><span className={styles.navDot}>✎</span>Tes Potensi</a>
          <a href="#berita" className={`${styles.navItem} ${active === 'berita' ? styles.active : ''}`} onClick={() => handleNavClick('berita')}><span className={styles.navDot}>📰</span>Berita</a>
        </div>

        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
          />
        )}
        <div style={{
          position: 'fixed', top: 0, right: menuOpen ? 0 : '-280px', width: 260, height: '100%',
          background: '#12325C', zIndex: 201, transition: 'right 0.25s ease',
          padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <button onClick={() => setMenuOpen(false)} style={{
            alignSelf: 'flex-end', background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer',
          }}>✕</button>
          <a href="#beranda" onClick={() => handleNavClick('beranda')} style={{ color: '#fff', fontSize: 15, textDecoration: 'none' }}>Beranda</a>
          <a href="#olimpiade" onClick={() => handleNavClick('olimpiade')} style={{ color: '#fff', fontSize: 15, textDecoration: 'none' }}>Olimpiade</a>
          <a href="#tespotensi" onClick={() => handleNavClick('tespotensi')} style={{ color: '#fff', fontSize: 15, textDecoration: 'none' }}>Tes Potensi</a>
          <a href="#berita" onClick={() => handleNavClick('berita')} style={{ color: '#fff', fontSize: 15, textDecoration: 'none' }}>Berita</a>
          <a href="#tentang" onClick={() => handleNavClick('tentang')} style={{ color: '#fff', fontSize: 15, textDecoration: 'none' }}>Tentang Kami / Kontak</a>
          {user ? (
            <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{
              background: '#22D3AE', color: '#12325C', textAlign: 'center', padding: '10px 16px',
              borderRadius: 10, fontWeight: 700, textDecoration: 'none', marginTop: 8,
            }}>Ke Dashboard</Link>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{
              background: '#22D3AE', color: '#12325C', textAlign: 'center', padding: '10px 16px',
              borderRadius: 10, fontWeight: 700, textDecoration: 'none', marginTop: 8,
            }}>Masuk / Daftar</Link>
          )}
        </div>

      </div>
    </div>
  );
}
