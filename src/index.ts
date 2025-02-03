import { Command } from "commander";
import { parseJSON } from "./parse";
import { renderTSTrie } from "./render";
import { readJSONsFromFiles, readJSONsFromSTDIN } from "./io";
import { ParseOptions, RenderOptions } from "./options";

async function main() {
  const program = new Command();
  program
    .option("-s, --spaces <spacedForTab>", "number of spaces for tab", "4")
    .option("-t, --use-tab", "use tab for indent", false)
    .option("-n, --type-name <typeName>", "type name", "JSON")
    .argument("[files...]", "File paths to read");
  program.parse();

  // parse
  const files = program.args;
  const jsons = await (files.length > 0
    ? readJSONsFromFiles(files)
    : readJSONsFromSTDIN());
  const parseOption: ParseOptions = {
    unionBy: {
      protoPayload: "methodName",
    },
    enumKeys: {
      severity: true,
    },
  };
  if (parseOption.unionBy) {
    for (const keyPath in parseOption.unionBy) {
      const classification = parseOption.unionBy[keyPath];
      if (typeof classification === "string") {
        parseOption.enumKeys ||= {};
        parseOption.enumKeys[keyPath + "." + classification] = true;
      }
    }
  }
  const parsed = parseJSON(jsons, parseOption);

  // render
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
