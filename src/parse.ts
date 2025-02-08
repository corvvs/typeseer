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

  const isOptOut = options.includeKeys ? false : true;
  for (const json of jsons) {
    subparse("", root, json, isOptOut, options);
  }

  return root;
}

function subparse(
  keyPath: string,
  currentNode: TSTrieNode,
  json: JSONFieldType,
  givenIsOptOut: boolean,
  options: ParseOptions
) {
  const fieldType = typeof json;
  currentNode.classification = (options.unionBy ?? {})[keyPath];
  currentNode.isDictionary = (options.dictionaryLikeKeys ?? {})[keyPath];
  let isOptOut = givenIsOptOut;
  if ((options.excludeKeys ?? {})[keyPath]) {
    isOptOut = false;
  } else if ((options.includeKeys ?? {})[keyPath]) {
    isOptOut = true;
  }

  const cnd = currentNode.candidates;
  if (typeof currentNode.classification !== "undefined") {
    // カスタム分類を行う
    if (Array.isArray(json) || typeof json !== "object") {
      console.warn("Invalid classification target", typeof json);
      return 0;
    }

    let classValue: string;
    if (typeof currentNode.classification === "string") {
      classValue = getByKeyPath(json, currentNode.classification);
      if (typeof classValue !== "string") {
        console.warn("Invalid classification value", classValue);
        return 0;
      }
    } else {
      classValue = currentNode.classification(json);
      if (typeof classValue !== "string") {
        console.warn("Invalid classification value", classValue);
        return 0;
      }
    }
    cnd[classValue] ||= newTrieTypeNode();
    subparseStructuredObject(keyPath, cnd[classValue], json, isOptOut, options);
  } else {
    // デフォルトの分類を行う
    if (Array.isArray(json)) {
      const array = cnd.array || newTrieTypeNode();
      const n = subparseArray(keyPath, array, json, isOptOut, options);
      if (!isOptOut && n === 0) {
        return 0;
      }
      cnd.array = array;
    } else if (json === null) {
      if (!isOptOut) {
        return 0;
      }
      cnd.null ||= newTrieTypeNode();
      cnd.null.count++;
    } else if (fieldType === "object") {
      const object = cnd.object || newTrieTypeNode();
      const n = currentNode.isDictionary
        ? subparseDictionaryLikeObject(keyPath, object, json, isOptOut, options)
        : subparseStructuredObject(keyPath, object, json, isOptOut, options);
      if (!isOptOut && n === 0) {
        return 0;
      }
      cnd.object = object;
    } else {
      if (!isOptOut) {
        return 0;
      }
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
  currentNode.isValid = true;
  return 1;
}

function subparseArray(
  keyPath: string,
  typeNode: TSTrieTypeNode,
  json: JSONFieldType[],
  isOptOut: boolean,
  options: ParseOptions
) {
  typeNode.count++;
  typeNode.arrayChildren ||= newTrieSubNode("[]");
  typeNode.arrayChildren.count++;
  let n = 0;
  for (const item of json) {
    n += subparse(
      keyPath ? keyPath + "[]" : ".[]",
      typeNode.arrayChildren!,
      item,
      isOptOut,
      options
    );
  }
  return n;
}

function subparseDictionaryLikeObject(
  keyPath: string,
  typeNode: TSTrieTypeNode,
  json: JSONFieldType,
  isOptOut: boolean,
  options: ParseOptions
) {
  typeNode.count++;
  typeNode.dictionaryChildren ||= newTrieSubNode("[]");
  typeNode.dictionaryChildren.count++;
  let n = 0;
  for (const [, value] of Object.entries(
    json as { [key in string]: JSONFieldType }
  )) {
    n += subparse(
      keyPath ? keyPath + "[]" : ".[]",
      typeNode.dictionaryChildren!,
      value,
      isOptOut,
      options
    );
  }
  return n;
}

function subparseStructuredObject(
  keyPath: string,
  typeNode: TSTrieTypeNode,
  json: JSONFieldType,
  isOptOut: boolean,
  options: ParseOptions
) {
  typeNode.count++;
  typeNode.structChildren ||= {};
  let n = 0;
  for (const [key, value] of Object.entries(
    json as { [key in string]: JSONFieldType }
  )) {
    typeNode.structChildren[key] ||= newTrieSubNode(key);
    typeNode.structChildren[key].count++;
    n += subparse(
      makeKeyPath(keyPath, key),
      typeNode.structChildren![key],
      value,
      isOptOut,
      options
    );
  }
  return n;
}
