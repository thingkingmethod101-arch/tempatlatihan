-- CreateEnum
CREATE TYPE "Role" AS ENUM ('siswa', 'orang_tua', 'tutor', 'sekolah', 'admin');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "NotifChannel" AS ENUM ('whatsapp', 'email', 'push');

-- CreateEnum
CREATE TYPE "NotifStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "FilePurpose" AS ENUM ('soal_gambar', 'ilustrasi_soal', 'sertifikat', 'ktp', 'ijazah', 'foto_profil', 'thumbnail_konten', 'dokumen_beasiswa');

-- CreateEnum
CREATE TYPE "EventMode" AS ENUM ('individual', 'terjadwal');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'published', 'berlangsung', 'selesai', 'dibatalkan');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('terdaftar', 'menunggu_pembayaran', 'batal');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('berlangsung', 'selesai', 'lolos', 'gugur');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('teks', 'gambar');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('menunggu', 'disetujui', 'ditolak');

-- CreateEnum
CREATE TYPE "TutorVerificationStatus" AS ENUM ('pending', 'disetujui', 'ditolak');

-- CreateEnum
CREATE TYPE "AksesSumber" AS ENUM ('sewa', 'beasiswa');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'lunas', 'gagal', 'kadaluarsa');

-- CreateEnum
CREATE TYPE "ScholarshipStatus" AS ENUM ('pending', 'disetujui', 'ditolak');

-- CreateEnum
CREATE TYPE "AlasanTidakSuka" AS ENUM ('kurang_seru', 'sulit_dipahami', 'pengalaman_buruk', 'lainnya');

-- CreateEnum
CREATE TYPE "PreferensiGaya" AS ENUM ('cerita', 'visual', 'sesi_singkat', 'banyak_latihan');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "npsn" TEXT,
    "nama" TEXT NOT NULL,
    "jenjang" TEXT[],
    "alamat" TEXT,
    "picUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "adminScope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kontak" TEXT NOT NULL,
    "schoolId" TEXT,
    "consentWa" BOOLEAN NOT NULL DEFAULT false,
    "consentData" BOOLEAN NOT NULL DEFAULT false,
    "consentGivenAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'password',
    "providerRef" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentChildLink" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'pending',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentChildLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "channel" "NotifChannel" NOT NULL,
    "isiTemplate" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateKode" TEXT NOT NULL,
    "channel" "NotifChannel" NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "payload" JSONB,
    "status" "NotifStatus" NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'public',
    "purpose" "FilePurpose" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "Role",
    "aksi" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillNode" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "parentSkillId" TEXT,
    "examContextTags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "mode" "EventMode" NOT NULL,
    "jenjang" TEXT NOT NULL,
    "skillNodeId" TEXT NOT NULL,
    "jadwal" TIMESTAMP(3),
    "syaratLolos" TEXT,
    "biaya" DECIMAL(12,2),
    "reward" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "scoringConfig" JSONB NOT NULL DEFAULT '{"benar": 10, "salah": 0, "kosong": 0}',
    "kuotaMinimum" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRound" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "namaBabak" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "jadwalMulai" TIMESTAMP(3),
    "durasiMenit" INTEGER NOT NULL,
    "kriteriaLolos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'terdaftar',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventQuestionPool" (
    "id" TEXT NOT NULL,
    "eventRoundId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "dikurasiOleh" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventQuestionPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAttempt" (
    "id" TEXT NOT NULL,
    "eventRoundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "durasiPengerjaanDetik" INTEGER,
    "skorFinal100" INTEGER,
    "xpDiperoleh" INTEGER,
    "status" "AttemptStatus" NOT NULL DEFAULT 'berlangsung',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventAttemptId" TEXT,
    "questionId" TEXT,
    "skillNodeId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "jawabanDipilih" JSONB,
    "benar" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardSnapshot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skor" INTEGER NOT NULL,
    "ranking" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sertifikat" (
    "id" TEXT NOT NULL,
    "eventRegistrationId" TEXT NOT NULL,
    "nomorSertifikat" TEXT NOT NULL,
    "fileAssetId" TEXT,
    "urlFile" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sertifikat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TierConfig" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "xpMultiplier" DECIMAL(4,2) NOT NULL,
    "xpBaseDefault" INTEGER NOT NULL,

    CONSTRAINT "TierConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "contentChapterId" TEXT,
    "skillNodeId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "illustrationUrl" TEXT,
    "questionType" "ContentType" NOT NULL,
    "questionText" TEXT,
    "questionImageUrl" TEXT,
    "poinBenar" INTEGER NOT NULL DEFAULT 10,
    "statusModerasi" "ModerationStatus" NOT NULL DEFAULT 'menunggu',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "urutan" TEXT NOT NULL,
    "tipe" "ContentType" NOT NULL,
    "konten" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "jenjangPendidikanTerakhir" TEXT NOT NULL,
    "dokumenIjazahUrl" TEXT,
    "dokumenIjazahFileAssetId" TEXT,
    "dokumenKtpUrl" TEXT,
    "dokumenKtpFileAssetId" TEXT,
    "statusVerifikasi" "TutorVerificationStatus" NOT NULL DEFAULT 'pending',
    "diverifikasiOleh" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "catatanVerifikasi" TEXT,
    "aksesJenjangKonten" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "skillNodeId" TEXT NOT NULL,
    "statusModerasi" "ModerationStatus" NOT NULL DEFAULT 'menunggu',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentChapter" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContentChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPricing" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "durasiBulan" INTEGER NOT NULL,
    "harga" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ContentPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentChapterId" TEXT,
    "contentId" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "sumber" "AksesSumber" NOT NULL,

    CONSTRAINT "ContentAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRating" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bintang" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentComment" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoyaltyLedger" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "tipe" TEXT NOT NULL,
    "splitPlatformPersen" INTEGER NOT NULL DEFAULT 30,
    "splitKreatorPersen" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoyaltyLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "jumlah" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "periode" TEXT NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimoni" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "Testimoni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "metode" TEXT NOT NULL DEFAULT 'qris',
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "qrisRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipProgram" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "kriteria" TEXT,
    "kuota" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'aktif',

    CONSTRAINT "ScholarshipProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipApplication" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dokumenPendukung" TEXT[],
    "status" "ScholarshipStatus" NOT NULL DEFAULT 'pending',
    "diverifikasiOleh" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "catatan" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScholarshipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentSummaryCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillNodeId" TEXT NOT NULL,
    "akurasi" DECIMAL(5,2) NOT NULL,
    "totalSoal" INTEGER NOT NULL,
    "ranking" INTEGER,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentSummaryCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentCareerMapping" (
    "id" TEXT NOT NULL,
    "skillNodeId" TEXT NOT NULL,
    "saranJurusan" TEXT[],
    "saranKarier" TEXT[],

    CONSTRAINT "TalentCareerMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningStyleSurvey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillNodeId" TEXT NOT NULL,
    "suka" BOOLEAN NOT NULL,
    "alasanTidakSuka" "AlasanTidakSuka",
    "preferensiGaya" "PreferensiGaya",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningStyleSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillNodeId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'santai_fokus',
    "presetDipilih" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "jumlahSiklusSelesai" INTEGER NOT NULL DEFAULT 0,
    "targetSiklus" INTEGER,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PomodoroSettings" (
    "id" TEXT NOT NULL,
    "siklusSebelumIstirahatPanjang" INTEGER NOT NULL DEFAULT 3,
    "durasiIstirahatPanjangMenit" INTEGER NOT NULL DEFAULT 15,

    CONSTRAINT "PomodoroSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "targetRole" "Role"[],
    "targetJenjang" TEXT[],
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_npsn_key" ON "School"("npsn");

-- CreateIndex
CREATE INDEX "School_npsn_idx" ON "School"("npsn");

-- CreateIndex
CREATE UNIQUE INDEX "User_kontak_key" ON "User"("kontak");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthCredential_userId_key" ON "AuthCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "ParentChildLink_childId_idx" ON "ParentChildLink"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentChildLink_parentId_childId_key" ON "ParentChildLink"("parentId", "childId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_kode_key" ON "NotificationTemplate"("kode");

-- CreateIndex
CREATE INDEX "NotificationLog_userId_status_idx" ON "NotificationLog"("userId", "status");

-- CreateIndex
CREATE INDEX "NotificationLog_refType_refId_idx" ON "NotificationLog"("refType", "refId");

-- CreateIndex
CREATE INDEX "FileAsset_ownerId_purpose_idx" ON "FileAsset"("ownerId", "purpose");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SkillNode_parentSkillId_idx" ON "SkillNode"("parentSkillId");

-- CreateIndex
CREATE INDEX "Event_skillNodeId_idx" ON "Event"("skillNodeId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "EventRound_eventId_idx" ON "EventRound"("eventId");

-- CreateIndex
CREATE INDEX "EventRound_tierId_idx" ON "EventRound"("tierId");

-- CreateIndex
CREATE INDEX "EventRegistration_userId_idx" ON "EventRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventQuestionPool_eventRoundId_idx" ON "EventQuestionPool"("eventRoundId");

-- CreateIndex
CREATE UNIQUE INDEX "EventQuestionPool_eventRoundId_questionId_key" ON "EventQuestionPool"("eventRoundId", "questionId");

-- CreateIndex
CREATE INDEX "EventAttempt_eventRoundId_userId_idx" ON "EventAttempt"("eventRoundId", "userId");

-- CreateIndex
CREATE INDEX "EventAttempt_userId_status_idx" ON "EventAttempt"("userId", "status");

-- CreateIndex
CREATE INDEX "Submission_userId_skillNodeId_idx" ON "Submission"("userId", "skillNodeId");

-- CreateIndex
CREATE INDEX "Submission_eventAttemptId_idx" ON "Submission"("eventAttemptId");

-- CreateIndex
CREATE INDEX "LeaderboardSnapshot_eventId_ranking_idx" ON "LeaderboardSnapshot"("eventId", "ranking");

-- CreateIndex
CREATE UNIQUE INDEX "Sertifikat_eventRegistrationId_key" ON "Sertifikat"("eventRegistrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Sertifikat_nomorSertifikat_key" ON "Sertifikat"("nomorSertifikat");

-- CreateIndex
CREATE UNIQUE INDEX "TierConfig_nama_key" ON "TierConfig"("nama");

-- CreateIndex
CREATE INDEX "Question_skillNodeId_tierId_idx" ON "Question"("skillNodeId", "tierId");

-- CreateIndex
CREATE INDEX "Question_statusModerasi_idx" ON "Question"("statusModerasi");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "TutorProfile_userId_key" ON "TutorProfile"("userId");

-- CreateIndex
CREATE INDEX "Content_ownerId_idx" ON "Content"("ownerId");

-- CreateIndex
CREATE INDEX "Content_statusModerasi_idx" ON "Content"("statusModerasi");

-- CreateIndex
CREATE INDEX "ContentChapter_contentId_idx" ON "ContentChapter"("contentId");

-- CreateIndex
CREATE INDEX "ContentPricing_contentId_idx" ON "ContentPricing"("contentId");

-- CreateIndex
CREATE INDEX "ContentAccess_userId_idx" ON "ContentAccess"("userId");

-- CreateIndex
CREATE INDEX "ContentAccess_expiresAt_idx" ON "ContentAccess"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRating_contentId_userId_key" ON "ContentRating"("contentId", "userId");

-- CreateIndex
CREATE INDEX "ContentComment_contentId_idx" ON "ContentComment"("contentId");

-- CreateIndex
CREATE INDEX "RoyaltyLedger_tutorId_idx" ON "RoyaltyLedger"("tutorId");

-- CreateIndex
CREATE INDEX "RoyaltyLedger_contentId_idx" ON "RoyaltyLedger"("contentId");

-- CreateIndex
CREATE INDEX "Payout_tutorId_idx" ON "Payout"("tutorId");

-- CreateIndex
CREATE INDEX "Transaction_userId_status_idx" ON "Transaction"("userId", "status");

-- CreateIndex
CREATE INDEX "Transaction_targetType_targetId_idx" ON "Transaction"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_userId_idx" ON "ScholarshipApplication"("userId");

-- CreateIndex
CREATE INDEX "ScholarshipApplication_status_idx" ON "ScholarshipApplication"("status");

-- CreateIndex
CREATE INDEX "TalentSummaryCache_userId_idx" ON "TalentSummaryCache"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentSummaryCache_userId_skillNodeId_key" ON "TalentSummaryCache"("userId", "skillNodeId");

-- CreateIndex
CREATE INDEX "TalentCareerMapping_skillNodeId_idx" ON "TalentCareerMapping"("skillNodeId");

-- CreateIndex
CREATE INDEX "LearningStyleSurvey_userId_skillNodeId_idx" ON "LearningStyleSurvey"("userId", "skillNodeId");

-- CreateIndex
CREATE INDEX "StudySession_userId_idx" ON "StudySession"("userId");

-- CreateIndex
CREATE INDEX "Announcement_expiresAt_idx" ON "Announcement"("expiresAt");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_picUserId_fkey" FOREIGN KEY ("picUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthCredential" ADD CONSTRAINT "AuthCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChildLink" ADD CONSTRAINT "ParentChildLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChildLink" ADD CONSTRAINT "ParentChildLink_childId_fkey" FOREIGN KEY ("childId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillNode" ADD CONSTRAINT "SkillNode_parentSkillId_fkey" FOREIGN KEY ("parentSkillId") REFERENCES "SkillNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRound" ADD CONSTRAINT "EventRound_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRound" ADD CONSTRAINT "EventRound_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "TierConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuestionPool" ADD CONSTRAINT "EventQuestionPool_eventRoundId_fkey" FOREIGN KEY ("eventRoundId") REFERENCES "EventRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuestionPool" ADD CONSTRAINT "EventQuestionPool_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuestionPool" ADD CONSTRAINT "EventQuestionPool_dikurasiOleh_fkey" FOREIGN KEY ("dikurasiOleh") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttempt" ADD CONSTRAINT "EventAttempt_eventRoundId_fkey" FOREIGN KEY ("eventRoundId") REFERENCES "EventRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttempt" ADD CONSTRAINT "EventAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_eventAttemptId_fkey" FOREIGN KEY ("eventAttemptId") REFERENCES "EventAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardSnapshot" ADD CONSTRAINT "LeaderboardSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sertifikat" ADD CONSTRAINT "Sertifikat_eventRegistrationId_fkey" FOREIGN KEY ("eventRegistrationId") REFERENCES "EventRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sertifikat" ADD CONSTRAINT "Sertifikat_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_contentChapterId_fkey" FOREIGN KEY ("contentChapterId") REFERENCES "ContentChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "TierConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorProfile" ADD CONSTRAINT "TutorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorProfile" ADD CONSTRAINT "TutorProfile_diverifikasiOleh_fkey" FOREIGN KEY ("diverifikasiOleh") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "TutorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentChapter" ADD CONSTRAINT "ContentChapter_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPricing" ADD CONSTRAINT "ContentPricing_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAccess" ADD CONSTRAINT "ContentAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentAccess" ADD CONSTRAINT "ContentAccess_contentChapterId_fkey" FOREIGN KEY ("contentChapterId") REFERENCES "ContentChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRating" ADD CONSTRAINT "ContentRating_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRating" ADD CONSTRAINT "ContentRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentComment" ADD CONSTRAINT "ContentComment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentComment" ADD CONSTRAINT "ContentComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentComment" ADD CONSTRAINT "ContentComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "ContentComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoyaltyLedger" ADD CONSTRAINT "RoyaltyLedger_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_programId_fkey" FOREIGN KEY ("programId") REFERENCES "ScholarshipProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipApplication" ADD CONSTRAINT "ScholarshipApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentSummaryCache" ADD CONSTRAINT "TalentSummaryCache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentSummaryCache" ADD CONSTRAINT "TalentSummaryCache_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentCareerMapping" ADD CONSTRAINT "TalentCareerMapping_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningStyleSurvey" ADD CONSTRAINT "LearningStyleSurvey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningStyleSurvey" ADD CONSTRAINT "LearningStyleSurvey_skillNodeId_fkey" FOREIGN KEY ("skillNodeId") REFERENCES "SkillNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
