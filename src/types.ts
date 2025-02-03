import { Classification } from "./options";

export type JSONFieldPrimitiveType = string | number | boolean | null;

export type JSONFieldType =
  | JSONFieldPrimitiveType
  | JSONFieldType[]
  | { [key in string]: JSONFieldType };

export type JSONFieldArray = JSONFieldType[];
export type JSONFieldObject = { [key in string]: JSONFieldType };

export const JSONFieldTypeKeys = [
  "string",
  "number",
  "boolean",
  "array",
  "object",
  "null",
] as const;
export type JSONFieldTypeKey = (typeof JSONFieldTypeKeys)[number];

export type TSTrieTypeNode = {
  count: number;
  arrayChildren?: TSTrieNode;
  objectChildren?: {
    [path in string]?: TSTrieNode;
  };
};

export type TSTrieStringTypeNode = TSTrieTypeNode & {
  isEnum?: boolean;
  stats: { [key in string]: number };
};

export type TSTrieRootNode = {
  count: number;
  classification?: Classification;
  candidates: { [key in string]: TSTrieTypeNode };
};

export type TSTrieSubNode = TSTrieRootNode & {
  key?: string;
};

export type TSTrieNode = TSTrieRootNode | TSTrieSubNode;

export function isTrieStringTypeNode(
  typeNode: TSTrieTypeNode
): typeNode is TSTrieStringTypeNode {
  return "stats" in typeNode;
}
