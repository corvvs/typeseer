import { isArray } from "util";

async function readAllStdin(): Promise<string> {
  process.stdin.setEncoding('utf-8');
  
  let data = '';
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data;
}

async function main() {

  const input = await readAllStdin();
  const json = JSON.parse(input);
  if (!Array.isArray(json)) {
    throw new Error('Input is not an array');
  }

  console.log(json);

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});