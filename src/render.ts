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

function renderTSTrieNode(
  node: TSTrieNode,
  options: RenderOptions,
  indentLevel = 0,
): string {
  const candidates = node.candidates;
  const types: string[] = [];

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
        types.push(`Array<${elementType}>`);
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

        let maxKeyPartLength = 0;
        for (const prop of Object.keys(candidate.objectChildren).sort()) {
          // NOTE: 厳密なフィールド所持判定
          if (Object.prototype.hasOwnProperty.call(candidate.objectChildren, prop)) {
            const childNode = candidate.objectChildren[prop]!;
            const childType = renderTSTrieNode(childNode, options, indentLevel + 1);
            const childCount = childNode.count;
            // NOTE: < の場合は何かがおかしい
            const isRequired = baseCount <= childCount;
            const keyPart = formatAsObjectKey(prop) + (isRequired ? '' : '?') + ':'
            if (maxKeyPartLength < keyPart.length) {
              maxKeyPartLength = keyPart.length;
            }
            props.push({
              keyPart,
              typePart: childType,
            });
          }
        }

        types.push(`{\n${props.map(p => {
          return `${indentSpaces1}${p.keyPart.padEnd(maxKeyPartLength)} ${p.typePart};\n`;
        }).join("")}${indentSpaces0}}`);
        break;
      }
    }
  }

  // NOTE: types.length === 0 はたとえばすべてのデータが空配列だった場合に起きる
  return types.length > 0 ? types.join(' | ') : 'any';
}


export function renderTSTrie(root: TSTrieRootNode, options: RenderOptions = {
  typeName: 'JSONType',
}): string {
  const typeBody = renderTSTrieNode(root, options);
  return `type ${options.typeName} = ${typeBody};`;
}
