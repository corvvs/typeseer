import { Command } from "commander";
import { parseJSON } from "./parse";
import { renderTSTrie } from "./render";
import { readJSONsFromFiles, readJSONsFromSTDIN, writeAllStdout } from "./io";
import { ParseOptions, RenderOptions } from "./options";

function collect(value: string, previous: string[]) {
  return (previous || []).concat([value]);
}

async function main() {
  const program = new Command();
  program
    .option("-s, --spaces <spacedForTab>", "number of spaces for tab", "4")
    .option("-t, --use-tab", "use tab for indent", false)
    .option("-n, --type-name <typeName>", "type name", "JSON")
    .option(
      "-d ,--dict-key <keypath>",
      "dictionary like keypath(repeatable)",
      collect
    )
    .option("-e ,--enum-key <keypath>", "enum keypath(repeatable)", collect)
    .option("-u ,--union-by <keypath:keypath>", "union by keypath", collect)
    .option("--exclude-key <keypath>", "exclude keypath(repeatable)", collect)
    .option("--include-key <keypath>", "include keypath(repeatable)", collect)
    .argument("[files...]", "File paths to read");
  program.parse();

  // parse
  const files = program.args;
  const jsons = await (files.length > 0
    ? readJSONsFromFiles(files)
    : readJSONsFromSTDIN());
  const parseOption: ParseOptions = {};

  if (program.opts().unionBy) {
    parseOption.unionBy = {};
    for (const keyPath of program.opts().unionBy) {
      const [key, classification] = keyPath.split(":");
      parseOption.unionBy[key] = classification;
    }
  }
  if (program.opts().enumKey) {
    parseOption.enumKeys = {};
    for (const keyPath of program.opts().enumKey) {
      parseOption.enumKeys[keyPath] = true;
    }
  }
  if (program.opts().dictKey) {
    parseOption.dictionaryLikeKeys = {};
    for (const keyPath of program.opts().dictKey) {
      parseOption.dictionaryLikeKeys[keyPath] = true;
    }
  }
  if (program.opts().excludeKey) {
    parseOption.excludeKeys = {};
    for (const keyPath of program.opts().excludeKey) {
      parseOption.excludeKeys[keyPath] = true;
    }
  }
  if (program.opts().includeKey) {
    parseOption.includeKeys = {};
    for (const keyPath of program.opts().includeKey) {
      parseOption.includeKeys[keyPath] = true;
    }
  }
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
  writeAllStdout(output);
  writeAllStdout("\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
