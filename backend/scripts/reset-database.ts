import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai pembersihan database...');

  await prisma.school.updateMany({ data: { picUserId: null } });

  await prisma.$transaction([
    prisma.questionOption.deleteMany({}),
    prisma.submission.deleteMany({}),
    prisma.eventQuestionPool.deleteMany({}),
    prisma.contentComment.deleteMany({}),
    prisma.contentRating.deleteMany({}),
    prisma.contentAccess.deleteMany({}),
    prisma.royaltyLedger.deleteMany({}),
    prisma.contentPricing.deleteMany({}),
    prisma.sertifikat.deleteMany({}),
    prisma.leaderboardSnapshot.deleteMany({}),
    prisma.eventSessionAssignment.deleteMany({}),
    prisma.eventSession.deleteMany({}),
    prisma.eventAttempt.deleteMany({}),
    prisma.eventRegistration.deleteMany({}),
    prisma.attemptUnlock.deleteMany({}),
    prisma.referralUsage.deleteMany({}),

    prisma.question.deleteMany({}),
    prisma.contentChapter.deleteMany({}),
    prisma.eventRound.deleteMany({}),
    prisma.referralCode.deleteMany({}),
    prisma.transaction.deleteMany({}),
    prisma.ledgerEntry.deleteMany({}),
    prisma.scholarshipApplication.deleteMany({}),
    prisma.talentSummaryCache.deleteMany({}),
    prisma.talentCareerMapping.deleteMany({}),
    prisma.learningStyleSurvey.deleteMany({}),
    prisma.studySession.deleteMany({}),
    prisma.psychTestOption.deleteMany({}),
    prisma.psychTestResult.deleteMany({}),
    prisma.berita.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.notificationLog.deleteMany({}),
    prisma.parentChildLink.deleteMany({}),

    prisma.content.deleteMany({}),
    prisma.event.deleteMany({}),
    prisma.scholarshipProgram.deleteMany({}),
    prisma.psychTestQuestion.deleteMany({}),
  ]);

  await prisma.fileAsset.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.authCredential.deleteMany({ where: { user: { role: { not: 'admin' } } } });
  await prisma.tutorProfile.deleteMany({ where: { user: { role: { not: 'admin' } } } });

  const hasilHapusUser = await prisma.user.deleteMany({ where: { role: { not: 'admin' } } });

  console.log(`Selesai. ${hasilHapusUser.count} akun (selain admin) terhapus.`);
  console.log('Skill Node, Tier Config, Sekolah, dan Pengaturan Sistem TETAP ADA.');
}

main()
  .catch((e) => {
    console.error('Gagal membersihkan database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });