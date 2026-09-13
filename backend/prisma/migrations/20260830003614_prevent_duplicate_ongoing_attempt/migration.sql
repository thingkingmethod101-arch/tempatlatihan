-- This is an empty migration.
CREATE UNIQUE INDEX "EventAttempt_ongoing_unique" ON "EventAttempt" ("eventRoundId", "userId") WHERE status = 'berlangsung';