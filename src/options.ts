export type ParseOptions = {
  unionBy?: UnionBy;
  enumKeys?: { [keyPath in string]: boolean };
};

export type RenderOptions = {
  typeName: string;
  tabForIndent?: boolean;
  spacesForTab?: number;
};

type KeyPath = string;
type Classifier = (subtree: any) => string;
export type Classification = KeyPath | Classifier;

type UnionBy = {
  [keyPath: KeyPath]: Classification;
};
