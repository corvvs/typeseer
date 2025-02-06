import { RenderOptions } from "./options";
import {
  isTrieStringTypeNode,
  JSONFieldTypeKeys,
  TSTrieNode,
  TSTrieRootNode,
  TSTrieTypeNode,
} from "./types";
import { formatAsObjectKey, makeKeyPath } from "./utils";

function makeIndent(indentLevel: number, options: RenderOptions): string {
  if (options.tabForIndent) {
    return "\t".repeat(indentLevel);
  } else {
    return " ".repeat(indentLevel * (options.spacesForTab || 4));
  }
}

function flushObjectLines(
  props: {
    keyPart: string;
    typePart: string;
    commentPart?: string;
  }[],
  indentSpaces: string,
  maxKeyPartLength: number
): string {
  let objectLines = "";
  for (const p of props) {
    const commentPart = p.commentPart ? ` // ${p.commentPart}` : "";
    objectLines += `${indentSpaces}${p.keyPart.padEnd(maxKeyPartLength)} ${
      p.typePart
    };${commentPart}\n`;
  }
  return objectLines;
}

type RenderResult = {
  body: string;
  hasObject: boolean;
  comment: string;
  isMultiline?: boolean;
};

function renderTSTrieNode(
  keyPath: string,
  node: TSTrieNode,
  options: RenderOptions,
  indentLevel = 0
): RenderResult {
  const candidates = node.candidates;
  const types: string[] = [];
  let hasObject = false;
  let comment = "";

  const indentSpaces0 = makeIndent(indentLevel, options);

  function renderDictionaryObject(candidate: TSTrieTypeNode): RenderResult {
    const elementType = renderTSTrieNode(
      keyPath ? keyPath + "[]" : ".[]",
      candidate.dictionaryChildren!,
      options,
      indentLevel
    );
    if (elementType.hasObject) {
      hasObject = true;
    }
    if (elementType.isMultiline) {
      // types.push(`{${classComment}\n${objectLines}${indentSpaces0}}`);
      const indentSpaces1 = makeIndent(indentLevel + 1, options);
      return {
        body: `{\n${indentSpaces1}[key in string]: ${elementType.body}\n${indentSpaces0}}`,
        hasObject,
        comment,
        isMultiline: true,
      };
    } else {
      return {
        body: `{ [key in string]: ${elementType.body} }`,
        hasObject,
        comment,
        isMultiline: false,
      };
    }
  }

  function renderStructuredObject(
    candidate: TSTrieTypeNode,
    classKey = ""
  ): RenderResult {
    if (!candidate.structChildren) {
      throw new Error("Object candidate should have objectChildren");
    }

    const baseCount = candidate.count;
    const props: {
      keyPart: string;
      typePart: string;
      commentPart?: string;
    }[] = [];
    const indentSpaces1 = makeIndent(indentLevel + 1, options);

    let objectLines = "";
    let maxKeyPartLength = 0;
    let keys = 0;

    for (const prop of Object.keys(candidate.structChildren).sort()) {
      // NOTE: 厳密なフィールド所持判定
      if (
        Object.prototype.hasOwnProperty.call(candidate.structChildren, prop)
      ) {
        const childNode = candidate.structChildren[prop]!;
        const childType = renderTSTrieNode(
          keyPath ? keyPath + "[]" : ".[]",
          childNode,
          options,
          indentLevel + 1
        );
        if (childType.hasObject) {
          objectLines += flushObjectLines(
            props,
            indentSpaces1,
            maxKeyPartLength
          );
          props.splice(0, props.length);
          maxKeyPartLength = 0;
        }

        const childCount = childNode.count;
        // NOTE: < の場合は何かがおかしい
        const isRequired = baseCount <= childCount;
        const keyPart = formatAsObjectKey(prop) + (isRequired ? "" : "?") + ":";
        if (maxKeyPartLength < keyPart.length) {
          maxKeyPartLength = keyPart.length;
        }
        props.push({
          keyPart,
          typePart: childType.body,
          commentPart: childType.comment,
        });
        keys += 1;
        if (childType.hasObject) {
          objectLines += flushObjectLines(
            props,
            indentSpaces1,
            maxKeyPartLength
          );
          props.splice(0, props.length);
          maxKeyPartLength = 0;
        }
      }
    }

    if (keys === 0) {
      return {
        body: "{}",
        hasObject: false,
        comment,
      };
    }
    hasObject = true;

    objectLines += flushObjectLines(props, indentSpaces1, maxKeyPartLength);
    const classComment = classKey ? ` // "${classKey}"` : "";
    return {
      body: `{${classComment}\n${objectLines}${indentSpaces0}}`,
      hasObject,
      comment,
      isMultiline: true,
    };
  }

  if (typeof node.classification !== "undefined") {
    const keys = Object.keys(candidates).sort();
    for (const key of keys) {
      const candidate = candidates[key];
      if (!candidate) continue;
      const result = renderStructuredObject(candidate, key);
      types.push(result.body);
    }
  } else {
    for (const key of JSONFieldTypeKeys) {
      const candidate = candidates[key];
      if (!candidate) continue;

      switch (key) {
        case "string":
          // enumかも？
          if (isTrieStringTypeNode(candidate)) {
            const keys = Object.keys(candidate.stats);
            const isEnum =
              candidate.isEnum ||
              (candidate.longCount === 0 && keys.length <= 10);
            if (isEnum) {
              if (keys.length === 1) {
                // サイズ1のenum = 定数
                types.push(`"${keys[0]}"`);
                comment = "Constant";
                break;
              } else {
                // enumかもしれない
                comment = Object.keys(candidate.stats)
                  .sort()
                  .map((key) => `"${key}"`)
                  .join(" | ");
              }
            }
          }
          types.push(key);
          break;
        case "number":
        case "boolean":
        case "null": {
          types.push(key);
          break;
        }

        case "array": {
          if (!candidate.arrayChildren) {
            throw new Error("Array candidate should have arrayChildren");
          }
          const elementType = renderTSTrieNode(
            keyPath ? keyPath + "[]" : ".[]",
            candidate.arrayChildren,
            options,
            indentLevel
          );
          types.push(`Array<${elementType.body}>`);
          if (elementType.hasObject) {
            hasObject = true;
          }
          break;
        }

        case "object":
          const result = candidate.dictionaryChildren
            ? renderDictionaryObject(candidate)
            : renderStructuredObject(candidate);
          types.push(result.body);
          break;
      }
    }
  }

  // NOTE: types.length === 0 はたとえばすべてのデータが空配列だった場合に起きる
  const result = types.length > 0 ? types.join(" | ") : "any";
  return {
    body: result,
    hasObject,
    comment,
  };
}

export function renderTSTrie(
  root: TSTrieRootNode,
  options: RenderOptions = {
    typeName: "JSONType",
  }
): string {
  const result = renderTSTrieNode("", root, options);
  return `type ${options.typeName} = ${result.body};`;
}
