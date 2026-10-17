// ============================================================

// ecosystem.config.js — PM2 Cluster Configuration
// ============================================================

// PM2 cluster mode permite ejecutar múltiples instancias del
// Express + Socket.IO en paralelo, usando todos los
// núcleos de la CPU. Cada instancia comparte el puerto 3000
// gracias al socket clustering de PM2.
// ============================================================

module.exports = {
  apps: [
    {
      name: 'project-one-api',
      // Usar el entry point del con tsx
      script: 'tsx src/bin/index.ts',
      // Cluster mode: crea N instancias (una por núcleo CPU)
      exec_mode: 'cluster',
      // 'max' = tantas instancias como núcleos la máquina
      instances: 'max',

      // --- Graceful Shutdown ---
      // Tiempo máximo para que el cierre cierre conexiones activas
      kill_timeout: 5000,
      // Tiempo máximo para que el inicio a aceptar conexiones
      listen_timeout: 3000,
      // Enviar señal SIGINT en lugar de SIGKILL para shutdown graceful
      shutdown_with_message: true,

      // --- Entorno ---
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },

      // --- Logs ---
      error_file: 'b/pm2-error.log',
      out_file: 'b/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // --- Watch & Restart ---
      watch: false,
      max_restarts: 10,
      restart: 4000,
    },
  ],
};
