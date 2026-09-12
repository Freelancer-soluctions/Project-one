// Prisma Raw SQL Injection vulnerability: $queryRaw with interpolated user input from req.query
// This should trigger the prisma-raw-sqli rule

// VULNERABLE: $queryRaw with string interpolation (SQL injection)
prisma.$queryRaw(`SELECT * FROM users WHERE id = ${req.query.userId}`);
