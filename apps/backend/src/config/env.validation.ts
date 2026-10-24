/** Uygulama açılışında zorunlu ortam değişkenlerini doğrular. */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required = ['DATABASE_URL'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`Eksik ortam değişkenleri: ${missing.join(', ')}`);
  }
  return config;
}
