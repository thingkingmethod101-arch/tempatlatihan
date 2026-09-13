import Link from 'next/link';

export default function SyaratKetentuanPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href="/register" className="text-sm text-blue-600 underline mb-4 inline-block">← Kembali ke Pendaftaran</Link>
      <h1 className="text-xl font-bold mb-4">Syarat & Ketentuan, Kebijakan Privasi</h1>

      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-1">1. Kepatuhan Terhadap Aturan</h2>
          <p>Dengan mendaftar, kamu menyetujui untuk mematuhi seluruh peraturan yang ditetapkan oleh pengelola Tempat Latihan.com, termasuk namun tidak terbatas pada aturan pelaksanaan kompetisi/olimpiade, tata tertib penggunaan platform, dan kebijakan yang berlaku dari waktu ke waktu.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">2. Penggunaan &amp; Perlindungan Data Pribadi</h2>
          <p>Data yang kamu berikan saat pendaftaran (nama, kontak, tanggal lahir, alamat, dan data lain yang relevan) digunakan semata-mata untuk keperluan pendaftaran akun, pelaksanaan kompetisi, dan operasional layanan platform. Kami tidak akan membagikan, menjual, atau menyebarkan data pribadimu kepada pihak ketiga manapun, kecuali kepada pihak berwajib yang memiliki wewenang sah berdasarkan hukum yang berlaku di Indonesia.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">3. Tanggung Jawab Konten dari Tutor/Konten Kreator</h2>
          <p>Seluruh materi, soal, video, dan konten lain yang diunggah oleh tutor/konten kreator merupakan tanggung jawab penuh dari tutor/konten kreator yang bersangkutan. Tempat Latihan.com berupaya semaksimal mungkin menjaga asas kesopanan, kelayakan, dan penghormatan terhadap hak cipta serta hak asasi pihak lain atas konten yang diunggah, namun tidak dapat menjamin sepenuhnya kebenaran, keakuratan, atau kepatuhan hukum dari setiap konten yang diunggah oleh pengguna.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">4. Perubahan Ketentuan</h2>
          <p>Ketentuan ini dapat diperbarui dari waktu ke waktu. Perubahan signifikan akan diinformasikan melalui platform.</p>
        </section>
      </div>
    </div>
  );
}