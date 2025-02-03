import { TSTrieStringTypeNode, TSTrieSubNode, TSTrieTypeNode } from "./types";

export function newTrieTypeNode(): TSTrieTypeNode {
  const r: TSTrieTypeNode = {
    count: 0,
  };
  return r;
}

export function newTrieStringTypeNode(): TSTrieStringTypeNode {
  const r: TSTrieStringTypeNode = {
    count: 0,
    longCount: 0,
    stats: {},
  };
  return r;
}

export function newTrieSubNode(key: string): TSTrieSubNode {
  const r: TSTrieSubNode = {
    key,
    count: 0,
    candidates: {},
  };
  return r;
}
