export function formatAsObjectKey(value: string): string {
  if (value.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
    return value;
  }
  return JSON.stringify(value);
}

export function makeKeyPath(prefix: string, key: string): string {
  const fkey = formatAsObjectKey(key);
  return concatKeyPath(prefix, fkey);
}

export function concatKeyPath(a: string, b: string) {
  return a ? a + "." + b : b;
}

export function decomposeKeyPath(keyPath: string): string[] {
  return keyPath.split(".");
}

export function getByKeyPath(obj: any, keyPath: string): any {
  const keys = decomposeKeyPath(keyPath);
  let current = obj;
  for (const key of keys) {
    if (typeof current !== "object") {
      return undefined;
    }
    current = current[key];
  }
  return current;
}
