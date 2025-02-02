import { JSONFieldTypeKeys, TSTrieNode, TSTrieRootNode } from "./types";

const spacesForTab = 4;

function renderTSTrieNode(
  node: TSTrieNode,
  indentLevel = 0,
): string {
  const candidates = node.candidates;
  const types: string[] = [];

  const indentSpaces0 = ' '.repeat((indentLevel) * spacesForTab);
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
        if (candidate.arrayChildren) {
          const elementType = renderTSTrieNode(candidate.arrayChildren);
          types.push(`Array<${elementType}>`);
        } else {
          types.push('any[]');
        }
        break;
      }

      case 'object': {
        const baseCount = candidate.count;
        if (candidate.objectChildren) {
          const props: string[] = [];
          const indentSpaces1 = ' '.repeat((indentLevel + 1) * spacesForTab);

          for (const prop in candidate.objectChildren) {
            // NOTE: 厳密なフィールド所持判定
            if (Object.prototype.hasOwnProperty.call(candidate.objectChildren, prop)) {
              const childNode = candidate.objectChildren[prop]!;
              const childType = renderTSTrieNode(childNode, indentLevel + 1);
              const childCount = childNode.count;
              // NOTE: < の場合は何かがおかしい
              const isRequired = baseCount <= childCount;
              props.push(`${indentSpaces1}${prop}${isRequired ? '' : '?'}: ${childType};\n`);
            }
          }

          types.push(`{\n${props.join("")}${indentSpaces0}}`);
        } else {
          types.push('{}');
        }
        break;
      }
    }
  }

  // NOTE: types.length === 0 の時は何かがおかしい
  return types.length > 0 ? types.join(' | ') : 'never';
}


export function renderTSTrie(root: TSTrieRootNode, typeName = "GeneratedType"): string {
  const typeBody = renderTSTrieNode(root);
  return `type ${typeName} = ${typeBody};`;
}
