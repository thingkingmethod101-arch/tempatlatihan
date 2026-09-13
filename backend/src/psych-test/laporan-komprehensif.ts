export const RIASEC_DESKRIPSI_MENDALAM: Record<string, { nama: string; karakter: string; kekuatan: string; areaBerkembang: string; contohAktivitas: string }> = {
  R: {
    nama: 'Realistic',
    karakter: 'cenderung praktis, menyukai hal-hal konkret, dan lebih suka "melakukan" daripada "membicarakan".',
    kekuatan: 'unggul dalam tugas yang butuh keterampilan tangan, ketahanan fisik, dan penyelesaian masalah nyata secara langsung.',
    areaBerkembang: 'komunikasi verbal dan kerja tim yang butuh banyak diskusi abstrak.',
    contohAktivitas: 'membongkar-pasang alat elektronik, olahraga, berkebun, atau kerajinan tangan.',
  },
  I: {
    nama: 'Investigative',
    karakter: 'analitis, penuh rasa ingin tahu, dan senang memahami "kenapa" sesuatu terjadi sebelum bertindak.',
    kekuatan: 'unggul dalam berpikir kritis, riset mendalam, dan memecahkan masalah kompleks secara sistematis.',
    areaBerkembang: 'eksekusi cepat dan kenyamanan bekerja dengan ketidakpastian/ambiguitas.',
    contohAktivitas: 'eksperimen sains, memecahkan teka-teki logika, atau membaca jurnal/artikel ilmiah.',
  },
  A: {
    nama: 'Artistic',
    karakter: 'ekspresif, orisinal, dan menghargai kebebasan berkreasi tanpa terlalu terikat aturan baku.',
    kekuatan: 'unggul dalam menghasilkan ide baru, berpikir out-of-the-box, dan mengekspresikan gagasan lewat berbagai media.',
    areaBerkembang: 'konsistensi mengikuti struktur/prosedur yang ketat.',
    contohAktivitas: 'menggambar, menulis, bermusik, atau mendesain sesuatu yang baru.',
  },
  S: {
    nama: 'Social',
    karakter: 'peduli pada orang lain, senang membantu, dan nyaman bekerja dalam interaksi sosial yang intens.',
    kekuatan: 'unggul dalam komunikasi, empati, mengajar, dan membangun hubungan kerja sama.',
    areaBerkembang: 'bekerja mandiri dalam waktu lama tanpa interaksi sosial.',
    contohAktivitas: 'mengajar teman, jadi sukarelawan, atau memimpin diskusi kelompok.',
  },
  E: {
    nama: 'Enterprising',
    karakter: 'percaya diri, suka memimpin, dan termotivasi oleh pencapaian serta pengaruh terhadap orang lain.',
    kekuatan: 'unggul dalam kepemimpinan, negosiasi, pengambilan keputusan cepat, dan memotivasi tim.',
    areaBerkembang: 'kesabaran menganalisis detail teknis sebelum bertindak.',
    contohAktivitas: 'mengorganisir acara, memimpin proyek kelompok, atau berjualan/promosi.',
  },
  C: {
    nama: 'Conventional',
    karakter: 'teratur, teliti, dan nyaman bekerja dengan aturan, data, serta prosedur yang jelas.',
    kekuatan: 'unggul dalam ketelitian, manajemen data, konsistensi, dan penyelesaian tugas administratif kompleks.',
    areaBerkembang: 'fleksibilitas menghadapi perubahan mendadak/situasi tanpa panduan jelas.',
    contohAktivitas: 'menyusun jadwal, mengelola data/anggaran, atau merapikan sistem/arsip.',
  },
};

export const GAYA_INFO: Record<string, { nama: string; tips: string; rencanaMingguan: string }> = {
  visual: {
    nama: 'Visual',
    tips: 'Gunakan mind map, diagram warna-warni, dan video pembelajaran untuk memaksimalkan penyerapan materi.',
    rencanaMingguan: 'Coba buat 1 mind map besar per minggu untuk merangkum 1 topik pelajaran, gunakan warna berbeda untuk tiap sub-topik.',
  },
  auditori: {
    nama: 'Auditori',
    tips: 'Rekam penjelasan guru/rangkuman sendiri lalu dengarkan berulang, atau belajar sambil diskusi kelompok.',
    rencanaMingguan: 'Sisihkan 2x seminggu untuk sesi belajar kelompok/diskusi lisan, dan rekam rangkumanmu sendiri untuk didengarkan ulang sebelum tidur.',
  },
  kinestetik: {
    nama: 'Kinestetik',
    tips: 'Belajar sambil praktik langsung (eksperimen, simulasi, atau menulis ulang materi dengan tangan) daripada cuma membaca diam.',
    rencanaMingguan: 'Coba ubah 1 materi teori jadi praktik nyata tiap minggu (eksperimen sederhana, permainan simulasi, atau tulis ulang catatan dengan tangan sambil bergerak).',
  },
};

export function analisisKonsentrasiLengkap(skorTinggi: number, skorRendah: number): { ringkasan: string; rencanaAksi: string } {
  if (skorTinggi >= skorRendah + 20) {
    return {
      ringkasan: 'Kamu punya kemampuan fokus yang cukup kuat secara alami.',
      rencanaAksi: 'Pertahankan dengan rutinitas belajar yang konsisten. Coba tantang dirimu dengan sesi belajar yang lebih panjang (45-60 menit) tanpa jeda untuk memaksimalkan potensimu ini.',
    };
  }
  if (skorRendah >= skorTinggi + 20) {
    return {
      ringkasan: 'Kamu cenderung mudah teralihkan saat belajar.',
      rencanaAksi: 'Coba teknik Pomodoro (25 menit fokus, 5 menit istirahat), jauhkan HP saat belajar, dan pilih tempat belajar yang minim gangguan visual/suara. Mulai dari sesi pendek dulu, tingkatkan durasinya bertahap.',
    };
  }
  return {
    ringkasan: 'Kemampuan fokusmu cukup seimbang, tergantung kondisi/mood.',
    rencanaAksi: 'Coba kenali situasi seperti apa yang bikin kamu paling mudah fokus (waktu tertentu, tempat tertentu, kondisi tertentu), lalu ciptakan kondisi itu sesering mungkin saat mau belajar hal penting.',
  };
}

const RIASEC_MAPEL_SELARAS: Record<string, string[]> = {
  R: ['ipa'], I: ['ipa', 'matematika'], A: ['seni', 'bahasa_indonesia'],
  S: ['bahasa_indonesia', 'ips'], E: ['ips'], C: ['matematika'],
};

export function analisisSilangMapel(kodeRiasecTertinggi: string, topMapel: string[]): string | null {
  const selaras = RIASEC_MAPEL_SELARAS[kodeRiasecTertinggi] ?? [];
  const cocok = topMapel.filter((m) => selaras.includes(m));
  if (cocok.length === 0) return null;
  return `Minat kariermu (${kodeRiasecTertinggi}) sejalan dengan minat mata pelajaranmu di ${cocok.join(', ').replace(/_/g, ' ')} — kombinasi yang cukup konsisten dan bisa jadi arah fokus pengembangan.`;
}

export function analisisSilangTalenta(
  kodeRiasecTertinggi: string,
  talentTertinggi: { skillNode: string; akurasi: number } | null,
): string | null {
  if (!talentTertinggi) return null;

  const akuratTinggi = talentTertinggi.akurasi >= 70;
  if (akuratTinggi) {
    return `Selaras dengan minatmu, hasil pengerjaan soal event menunjukkan kamu memang punya kemampuan objektif kuat di ${talentTertinggi.skillNode} (akurasi ${talentTertinggi.akurasi}%) — ini kombinasi minat dan kemampuan yang sangat baik untuk dikembangkan lebih jauh.`;
  }
  return `Menariknya, walau minatmu condong ke tipe ${kodeRiasecTertinggi}, hasil pengerjaan soal event menunjukkan akurasimu di ${talentTertinggi.skillNode} baru ${talentTertinggi.akurasi}% — ini bukan berarti tidak cocok, tapi mungkin butuh lebih banyak latihan supaya kemampuan sejalan dengan minatmu.`;
}

export function buatRencana30_60_90(namaTipeTertinggi: string, contohAktivitas: string): string[] {
  return [
    `30 Hari Pertama: Fokus eksplorasi. Coba 2-3 aktivitas terkait tipe ${namaTipeTertinggi}, seperti ${contohAktivitas} — cukup untuk mengenal apakah kamu benar-benar menikmatinya dalam praktik, bukan cuma teori.`,
    `60 Hari Berikutnya: Perdalam salah satu aktivitas yang paling kamu nikmati dari tahap sebelumnya. Cari mentor, tutorial, atau komunitas terkait bidang itu untuk belajar lebih terstruktur.`,
    `90 Hari: Coba hasilkan 1 "karya" atau pencapaian kecil dari bidang itu (proyek sederhana, kompetisi, atau portofolio) untuk menguji sejauh mana minat ini bisa berkembang jadi kemampuan nyata.`,
  ];
}