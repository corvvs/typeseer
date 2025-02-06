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
  currentNode.isDictionary = (options.dictionaryLikeKeys ?? {})[keyPath];

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
    subparseStructuredObject(keyPath, cnd[classValue], json, options);
  } else {
    // デフォルトの分類を行う
    if (Array.isArray(json)) {
      cnd.array ||= newTrieTypeNode();
      subparseArray(keyPath, cnd.array, json, options);
    } else if (json === null) {
      cnd.null ||= newTrieTypeNode();
      cnd.null.count++;
    } else if (fieldType === "object") {
      cnd.object ||= newTrieTypeNode();
      if (currentNode.isDictionary) {
        subparseDictionaryLikeObject(keyPath, cnd.object, json, options);
      } else {
        subparseStructuredObject(keyPath, cnd.object, json, options);
      }
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

function subparseArray(
  keyPath: string,
  typeNode: TSTrieTypeNode,
  json: JSONFieldType[],
  options: ParseOptions
) {
  typeNode.count++;
  typeNode.arrayChildren ||= newTrieSubNode("[]");
  typeNode.arrayChildren.count++;
  for (const item of json) {
    subparse(
      keyPath ? keyPath + "[]" : ".[]",
      typeNode.arrayChildren!,
      item,
      options
    );
  }
}

function subparseDictionaryLikeObject(
  keyPath: string,
  typeNode: TSTrieTypeNode,
  json: JSONFieldType,
  options: ParseOptions
) {
  typeNode.count++;
  typeNode.dictionaryChildren ||= newTrieSubNode("[]");
  typeNode.dictionaryChildren.count++;
  for (const [, value] of Object.entries(
    json as { [key in string]: JSONFieldType }
  )) {
    subparse(
      keyPath ? keyPath + "[]" : ".[]",
      typeNode.dictionaryChildren!,
      value,
      options
    );
  }
}

function subparseStructuredObject(
  keyPath: string,
  typeNode: TSTrieTypeNode,
  json: JSONFieldType,
  options: ParseOptions
) {
  typeNode.count++;
  typeNode.structChildren ||= {};
  for (const [key, value] of Object.entries(
    json as { [key in string]: JSONFieldType }
  )) {
    typeNode.structChildren[key] ||= newTrieSubNode(key);
    typeNode.structChildren[key].count++;
    subparse(
      makeKeyPath(keyPath, key),
      typeNode.structChildren![key],
      value,
      options
    );
  }
}
