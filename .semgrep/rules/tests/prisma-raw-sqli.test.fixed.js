// Prisma Raw SQL fix: parameterized query with Prisma.sql (true-negative)
// This should NOT trigger the prisma-raw-sqli rule

// SAFE: parameterized query with Prisma.sql tagged template (no string interpolation)
const validatedId = validateUserId(req.query.userId);
prisma.$queryRaw(Prisma.sql`SELECT * FROM users WHERE id = ${validatedId}`);
