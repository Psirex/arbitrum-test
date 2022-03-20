export function logParams(message: string, params: Record<string, any>) {
  console.log(message);
  for (const [key, value] of Object.entries(params)) {
    console.log(`  * ${key}: ${value}`);
  }
}
