// Prisma Raw SQL Injection (CWE-89) test fixtures - vulnerable case
// vulnerable: should trigger the rule (queryRaw with interpolated user input)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// VULNERABLE: user input directly interpolated in $queryRaw
const userId = req.query.id; // uncontrolled user input
const result = await prisma.$queryRaw(
  Prisma.sql`SELECT * FROM users WHERE id = ${userId}`
); // ← this should trigger the rule (interpolation, NOT parameterized)
