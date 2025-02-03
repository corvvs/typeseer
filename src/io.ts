import * as fs from "fs";

async function readAllStdin(): Promise<string> {
  process.stdin.setEncoding("utf-8");

  let data = "";
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data;
}

export async function readJSONsFromFiles(files: string[]) {
  const jsons: any[] = [];
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      let json = JSON.parse(content);
      if (!Array.isArray(json)) {
        console.warn(
          `Warning: File ${filePath} is not an array, wrapping it in an array`
        );
        json = [json];
      }
      jsons.push(...json);
    } catch (err: any) {
      console.error(`Error reading file ${filePath}: ${err.message}`);
    }
  }
  return jsons;
}

export async function readJSONsFromSTDIN() {
  const input = await readAllStdin();
  let json = JSON.parse(input);
  if (!Array.isArray(json)) {
    console.warn("Warning: Input is not an array, wrapping it in an array");
    json = [json];
  }
  return json as any[];
}
