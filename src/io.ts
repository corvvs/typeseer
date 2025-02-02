export async function readAllStdin(): Promise<string> {
  process.stdin.setEncoding('utf-8');
  
  let data = '';
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data;
}