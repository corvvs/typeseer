import { Command } from "commander";
import { parseJSON } from "./parse";
import { renderTSTrie } from "./render";
import { readJSONsFromFiles, readJSONsFromSTDIN } from "./io";
import { RenderOptions } from "./options";

async function main() {
  const program = new Command();
  program
    .option('-s, --spaces <spacedForTab>', 'number of spaces for tab', '4')
    .option('-t, --tab-for-indent', 'use tab for indent', false)
    .option('-n, --type-name <typeName>', 'type name', 'JSON')
    .argument('[files...]', 'File paths to read');
  program.parse();
  
  const files = program.args;
  const jsons = await (files.length > 0 ? readJSONsFromFiles(files) : readJSONsFromSTDIN());
  const parsed = parseJSON(jsons);

  const renderOption: RenderOptions = {
    typeName: program.opts().typeName,
    tabForIndent: program.opts().tabForIndent,
    spacesForTab: parseInt(program.opts().spaces, 10),
  };
  const output = renderTSTrie(parsed, renderOption);
  console.log(output);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
