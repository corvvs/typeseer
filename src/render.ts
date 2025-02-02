import { RenderOptions } from "./options";
import { JSONFieldTypeKeys, TSTrieNode, TSTrieRootNode } from "./types";
import { formatAsObjectKey } from "./utils";

function makeIndent(indentLevel: number, options: RenderOptions): string {
  if (options.tabForIndent) {
    return '\t'.repeat(indentLevel);
  } else {
    return ' '.repeat((indentLevel) * (options.spacesForTab || 4));
  }
}

function flushObjectLines(props: {
  keyPart: string;
  typePart: string;
}[], indentSpaces: string, maxKeyPartLength: number): string {
  let objectLines = "";
  for (const p of props) {
    objectLines += `${indentSpaces}${p.keyPart.padEnd(maxKeyPartLength)} ${p.typePart};\n`;
  }
  return objectLines;
}

type RenderResult = {
  body: string;
  hasObject: boolean;
};

function renderTSTrieNode(
  node: TSTrieNode,
  options: RenderOptions,
  indentLevel = 0,
): RenderResult {
  const candidates = node.candidates;
  const types: string[] = [];
  let hasObject = false;

  const indentSpaces0 = makeIndent(indentLevel, options);
  for (const key of JSONFieldTypeKeys) {
    const candidate = candidates[key];
    if (!candidate) continue;

    switch (key) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'null': {
        types.push(key);
        break;
      }

      case 'array': {
        if (!candidate.arrayChildren) {
          throw new Error('Array candidate should have arrayChildren');
        }
        const elementType = renderTSTrieNode(candidate.arrayChildren, options, indentLevel);
        types.push(`Array<${elementType.body}>`);
        if (elementType.hasObject) {
          hasObject = true;
        }
        break;
      }

      case 'object': {
        const baseCount = candidate.count;
        if (!candidate.objectChildren) {
          throw new Error('Object candidate should have objectChildren');
        }
        const props: {
          keyPart: string;
          typePart: string;
        }[] = [];
        const indentSpaces1 = makeIndent(indentLevel + 1, options);

        let objectLines = "";
        let maxKeyPartLength = 0;
        let keys = 0;

        for (const prop of Object.keys(candidate.objectChildren).sort()) {
          // NOTE: 厳密なフィールド所持判定
          if (Object.prototype.hasOwnProperty.call(candidate.objectChildren, prop)) {
            const childNode = candidate.objectChildren[prop]!;
            const childType = renderTSTrieNode(childNode, options, indentLevel + 1);
            if (childType.hasObject) {
              objectLines += flushObjectLines(props, indentSpaces1, maxKeyPartLength);
              props.splice(0, props.length);
              maxKeyPartLength = 0;
            }

            const childCount = childNode.count;
            // NOTE: < の場合は何かがおかしい
            const isRequired = baseCount <= childCount;
            const keyPart = formatAsObjectKey(prop) + (isRequired ? '' : '?') + ':'
            if (maxKeyPartLength < keyPart.length) {
              maxKeyPartLength = keyPart.length;
            }
            props.push({
              keyPart,
              typePart: childType.body,
            });
            keys += 1;
            if (childType.hasObject) {
              objectLines += flushObjectLines(props, indentSpaces1, maxKeyPartLength);
              props.splice(0, props.length);
              maxKeyPartLength = 0;
            }
          }
        }

        if (keys === 0) {
          types.push('{}');
          break;
        }
        hasObject = true;

        objectLines += flushObjectLines(props, indentSpaces1, maxKeyPartLength);

        types.push(`{\n${objectLines}${indentSpaces0}}`);
        break;
      }
    }
  }

  // NOTE: types.length === 0 はたとえばすべてのデータが空配列だった場合に起きる
  const result = types.length > 0 ? types.join(' | ') : 'any';
  return {
    body: result,
    hasObject,
  }
}

export function renderTSTrie(root: TSTrieRootNode, options: RenderOptions = {
  typeName: 'JSONType',
}): string {
  const result = renderTSTrieNode(root, options);
  return `type ${options.typeName} = ${result.body};`;
}
