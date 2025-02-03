import { ParseOptions } from "./options";
import { newTrieStringTypeNode, newTrieSubNode, newTrieTypeNode } from "./trie";
import {
  JSONFieldType,
  TSTrieNode,
  TSTrieRootNode,
  TSTrieStringTypeNode,
  TSTrieTypeNode,
} from "./types";
import { getByKeyPath, makeKeyPath } from "./utils";

export function parseJSON(
  jsons: JSONFieldType[],
  options: ParseOptions
): TSTrieRootNode {
  const root: TSTrieRootNode = {
    count: 1,
    candidates: {},
  };

  for (const json of jsons) {
    subparse("", root, json, options);
  }

  return root;
}

function subparse(
  keyPath: string,
  currentNode: TSTrieNode,
  json: JSONFieldType,
  options: ParseOptions
) {
  const fieldType = typeof json;
  currentNode.classification = (options.unionBy ?? {})[keyPath];

  const cnd = currentNode.candidates;
  if (typeof currentNode.classification !== "undefined") {
    // カスタム分類を行う
    if (Array.isArray(json) || typeof json !== "object") {
      console.warn("Invalid classification target", typeof json);
      return;
    }

    let classValue: string;
    if (typeof currentNode.classification === "string") {
      classValue = getByKeyPath(json, currentNode.classification);
      if (typeof classValue !== "string") {
        console.warn("Invalid classification value", classValue);
        return;
      }
    } else {
      classValue = currentNode.classification(json);
      if (typeof classValue !== "string") {
        console.warn("Invalid classification value", classValue);
        return;
      }
    }
    cnd[classValue] ||= newTrieTypeNode();
    subparseObject(keyPath, cnd[classValue], json, options);
  } else {
    // デフォルトの分類を行う
    if (Array.isArray(json)) {
      cnd.array ||= newTrieTypeNode();
      cnd.array.count++;
      cnd.array.arrayChildren ||= newTrieSubNode("[]");
      cnd.array.arrayChildren.count++;
      for (const item of json) {
        subparse(
          keyPath ? keyPath + "[]" : ".[]",
          cnd.array.arrayChildren!,
          item,
          options
        );
      }
    } else if (json === null) {
      cnd.null ||= newTrieTypeNode();
      cnd.null.count++;
    } else if (fieldType === "object") {
      cnd.object ||= newTrieTypeNode();
      subparseObject(keyPath, cnd.object, json, options);
    } else {
      switch (fieldType) {
        case "string":
          cnd.string ||= newTrieStringTypeNode();
          const typeNode = cnd.string as TSTrieStringTypeNode;
          typeNode.count++;
          const value = json as string;
          if (options.enumKeys && options.enumKeys[keyPath] === true) {
            typeNode.stats[value] ||= 0;
            typeNode.stats[value]++;
            typeNode.isEnum = true;
          } else {
            if (value.length > 24) {
              typeNode.longCount++;
            } else {
              typeNode.stats[value] ||= 0;
              typeNode.stats[value]++;
            }
          }
          break;
        case "number":
          cnd.number ||= newTrieTypeNode();
          cnd.number.count++;
          break;
        case "boolean":
          cnd.boolean ||= newTrieTypeNode();
          cnd.boolean.count++;
          break;
        default:
          throw new Error("Unexpected JSON type");
      }
    }
  }
}

function subparseObject(
  keyPath: string,
  typeNode: TSTrieTypeNode,
  json: JSONFieldType,
  options: ParseOptions
) {
  typeNode.count++;
  typeNode.objectChildren ||= {};
  for (const [key, value] of Object.entries(
    json as { [key in string]: JSONFieldType }
  )) {
    typeNode.objectChildren[key] ||= newTrieSubNode(key);
    typeNode.objectChildren[key].count++;
    subparse(
      makeKeyPath(keyPath, key),
      typeNode.objectChildren![key],
      value,
      options
    );
  }
}
