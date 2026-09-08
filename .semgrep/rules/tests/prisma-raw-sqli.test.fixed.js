// Prisma Raw SQL Injection (CWE-89) test fixtures
// vulnerable: should trigger the rule (queryRaw with interpolated user input)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// VULNERABLE: user input directly interpolated in $queryRaw
const userId = req.query.id; // uncontrolled user input
const result = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM users WHERE id = ${userId}`
); // ← this should trigger the rule (interpolation, NOT parameterized)

// fixed: should NOT trigger the rule (parameterized query with validated input)
const safeId = validateAndSanitize(req.query.id); // validated input
const result2 = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM users WHERE id = ${safeId}`
); // ← this should NOT trigger the rule (parameterized, ${safeId} is validated)

// Alternatively, use bind parameters for true safety:
const result3 = await prisma.$queryRawFromArray(
  'SELECT * FROM users WHERE id = ?',
  [validatedId] // ← parameterized, safe
);
