import { newTrieSubNode, newTrieTypeNode } from "./trie";
import { JSONFieldType, TSTrieNode, TSTrieRootNode } from "./types";

export function parseJSON(jsons: JSONFieldType[]): TSTrieRootNode {
  const root: TSTrieRootNode = {
    count: 1,
    candidates: {},
  };

  for (const json of jsons) {
      subparse(root, json);
  }

  return root;
}

function subparse(currentNode: TSTrieNode, json: JSONFieldType) {
  const fieldType = typeof json;
  if (Array.isArray(json)) {
    currentNode.candidates.array ||= newTrieTypeNode();
    currentNode.candidates.array.count++;
    currentNode.candidates.array.arrayChildren ||= newTrieSubNode("[]");
    currentNode.candidates.array.arrayChildren.count++;
    for (const item of json) {
      subparse(currentNode.candidates.array.arrayChildren!, item);
    }
  } else if (json === null) {
    currentNode.candidates.null ||= newTrieTypeNode(); 
    currentNode.candidates.null.count++;
  } else if (fieldType === 'object') {
    currentNode.candidates.object ||= newTrieTypeNode();
    currentNode.candidates.object.count++;
    currentNode.candidates.object.objectChildren = currentNode.candidates.object.objectChildren || {};
    for (const [key, value] of Object.entries(json as { [key in string]: JSONFieldType })) {
      currentNode.candidates.object.objectChildren[key] ||= newTrieSubNode(key);
      currentNode.candidates.object.objectChildren[key].count++;
      subparse(currentNode.candidates.object.objectChildren![key], value);
    }
  } else {
    switch (fieldType) {
      case 'string':
        currentNode.candidates.string ||= newTrieTypeNode(); 
        currentNode.candidates.string.count++;
        break;
      case 'number':
        currentNode.candidates.number ||= newTrieTypeNode(); 
        currentNode.candidates.number.count++;
        break;
      case 'boolean':
        currentNode.candidates.boolean ||= newTrieTypeNode(); 
        currentNode.candidates.boolean.count++;
        break;
      default:
        throw new Error('Unexpected JSON type');
    }
  }

}


