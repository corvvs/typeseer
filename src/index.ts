import { readAllStdin } from "./io";
import { parseJSON } from "./parse";
import { renderTSTrie } from "./render";

async function main() {

  const input = await readAllStdin();
  let json = JSON.parse(input);
  if (!Array.isArray(json)) {
    console.warn("Input is not an array, wrapping it in an array");
    json = [json];
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
