export function formatAsObjectKey(value: string): string {
  if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    return value;
  }
  return JSON.stringify(value);
}
