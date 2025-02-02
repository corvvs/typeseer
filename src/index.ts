import { Command } from "commander";
import { parseJSON } from "./parse";
import { renderTSTrie } from "./render";
import { readJSONsFromFiles, readJSONsFromSTDIN } from "./io";

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
