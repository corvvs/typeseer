export type JSONFieldPrimitiveType =
  | string
  | number
  | boolean
  | null;

export type JSONFieldType =
  | JSONFieldPrimitiveType
	| JSONFieldType[]
	| { [key in string]: JSONFieldType }

export type JSONFieldArray = JSONFieldType[];
export type JSONFieldObject = { [key in string]: JSONFieldType };

export const JSONFieldTypeKeys = ['string', 'number', 'boolean', 'array', 'object', 'null'] as const;
export type JSONFieldTypeKey = typeof JSONFieldTypeKeys[number];

export type TSTrieTypeNode = {
  count: number;
  arrayChildren?: TSTrieNode;
  objectChildren?: {
    [path in string]?: TSTrieNode;
  };
};

export type TSTrieRootNode = {
  count: number;
  candidates: { [key in JSONFieldTypeKey]?: TSTrieTypeNode };
}

export type TSTrieSubNode = {
  key?: string;
  count: number;
  candidates: { [key in JSONFieldTypeKey]?: TSTrieTypeNode };
}

export type TSTrieNode = TSTrieRootNode | TSTrieSubNode;

