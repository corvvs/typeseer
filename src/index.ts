import { readAllStdin } from "./io";
import { parseJSON } from "./parse";
import { renderTSTrie } from "./render";

async function main() {

  const input = await readAllStdin();
  const json = JSON.parse(input);
  if (!Array.isArray(json)) {
    throw new Error('Input is not an array');
  }

  const parsed = parseJSON(json);
  console.log(input);
  console.log("---");
  console.log(renderTSTrie(parsed));

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
