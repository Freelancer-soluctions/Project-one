const minMaxValues = {
    minLength: (amount) => `You must enter at least ${amount} characters.`,
    maxLength: (amount) => `You must enter a maximum of ${amount} characters.`,
  };
  
export const AUTH_VALIDATIONS = {
    firstName: {
      empty: "Por favor ingresa tu nombre.",
      ...minMaxValues,
    },
    lastName: {
      empty: "Por favor ingresa tu apellido",
      ...minMaxValues,
    },
    email: {
      empty: "You must enter your email.",
      invalid: "Invalid email address.",
    },
    password: {
      empty: "You must enter your password.",
      ...minMaxValues,
    },
    confirmPassword: {  
      valid: "Las contraseñas no coinciden.",
      empty: "Por favor ingresa tu contraseña.",
      ...minMaxValues,
    },
  };