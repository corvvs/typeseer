import { Command } from "commander";
import * as fs from 'fs';
import { readAllStdin } from "./io";
import { parseJSON } from "./parse";
import { renderTSTrie } from "./render";

async function readJSONsFromFiles(files: string[]) {
  const jsons: any[] = [];
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let json = JSON.parse(content);
      if (!Array.isArray(json)) {
        console.warn(`Warning: File ${filePath} is not an array, wrapping it in an array`);
        json = [json];
      }
      jsons.push(...json);
    } catch (err: any) {
      console.error(`Error reading file ${filePath}: ${err.message}`);
    }
  }
  return jsons;
}

async function readJSONsFromSTDIN() {
  const input = await readAllStdin();
  let json = JSON.parse(input);
  if (!Array.isArray(json)) {
    console.warn("Warning: Input is not an array, wrapping it in an array");
    json = [json];
  }
  return json as any[];
}

async function main() {
  const program = new Command();
  program
    .argument('[files...]', 'File paths to read')
    .action(async (files: string[]) => {
      const jsons = await (files.length > 0 ? readJSONsFromFiles(files) : readJSONsFromSTDIN());
      const parsed = parseJSON(jsons);
      console.log(renderTSTrie(parsed));
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
