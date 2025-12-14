export const SensitiveData = {
  critical: [
    // Documentos de identidad
    'socialSecurity',
    'document',
    'dni',

    // Información financiera
    'salary',
    'baseSalary',
    'extraHours',
    'deductions',
    'totalPayment',

    // Información financiera
    'salary',
    'baseSalary',
    'extraHours',
    'deductions',
    'totalPayment'

  ],
  sensitive: [
    // Información personal
    'email',
    'contactEmail',
    'name',
    'lastName',
    'contactName',

    // Información demográfica
    'birthday',
    'city',
    'state',
    'zipcode',

    // Información laboral
    'startDate',
    'position',
    'department'
  ]
}

export const sensitiveFields = [
  ...SensitiveData.critical
  // ...SensitiveData.sensitive
]

// model users {
//   email          String  // ❌ Email en texto plano
//   telephone      String  // ❌ Teléfono en texto plano
//   address        String  // ❌ Dirección en texto plano
//   socialSecurity String  // 🔴 SSN en texto plano (CRÍTICO)
//   document       String  // 🔴 Documento de identidad en texto plano
// }

// model employees {
//   dni     String  // 🔴 DNI en texto plano (CRÍTICO)
//   email   String  // ❌ Email en texto plano
//   phone   String  // ❌ Teléfono en texto plano
//   address String  // ❌ Dirección en texto plano
//   salary  Decimal // 🔴 Salario en texto plano (SENSIBLE)
// }

// model clients {
//   email   String  // ❌ Email en texto plano
//   phone   String  // ❌ Teléfono en texto plano
//   address String  // ❌ Dirección en texto plano
// }

// Esto sirve para:

// evitar loggear datos críticos

// crear middleware de sanitización de logs

// montar reglas automáticas (ej: cifrar todo lo que esté en critical)

// validar PRs automáticamente
