import { Config, Section } from "./parser";

export function generateConfig(node: Config | Section, indent=0): string {
  let result = '';

  for (const key in node) {
    if (!node.hasOwnProperty(key)) {
      continue
    }
    const value = node[key];

    if (key === 'comment') {
      result += `${' '.repeat(indent*2)}${value}\n`;
      continue;
    }

    if (typeof(value) === 'string') {
      result += `${' '.repeat(indent*2)}${key} ${value}\n`;
    }

    if (typeof(value) === 'boolean') {
      result += `${' '.repeat(indent*2)}${key}\n`;
    }

    if (typeof value === 'object') {
      result += `${' '.repeat(indent*2)}${key} {\n`;
      result += generateConfig(value, indent+1);
      result += `${' '.repeat(indent*2)}}\n`;
    }
  }
  return result;
}
