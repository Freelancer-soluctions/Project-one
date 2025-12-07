export const SensitiveData = {
  critical: [
    'socialSecurity',
    'document',
    'dni',
    'salary'

  ],
  sensitive: [
    'email',
    'telephone',
    'phone',
    'address'

  ]
}

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
