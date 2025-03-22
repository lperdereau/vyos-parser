export type Config = {
  [key: string]: Section;
};

export type QuotedString = string;

export type Value = QuotedString | string | number | boolean;

export type Section = { comment?: string } & {
  [key: string]: Value | Section;
};

// Matches section start `interfaces {`
const SectionRegex = /^([\w-]+) \{$/u;

// Matches named section `ethernet eth0 {`
const NamedSectionRegex = /^([\w-]+) ([".\/@:=+\w-]+) \{$/u;
// SyntaxError: Invalid regular expression: /^([\w-]+) ([\w\-\"\.\/@:=\+]+) \{$/: Invalid escape

// Matches simple key-value pair `duplex auto`
const ValueRegex = /^([\w-]+) "?([^"]+)?"?$/u;

// Matches single value (flag) `disable`
// const FlagRegex = /^([\w-]+)$/u;

// Matches comments
const CommentRegex = /^(\/\*).*(\*\/)/u;


function parseComment(comment: string): string | null {
  const matches = comment.trim().match(CommentRegex);
  if (matches) {
    return matches[0];
  }
  return null;

}

function parseValue(value: string): Value | null {
  const matches = value.trim().match(ValueRegex);
  if (matches) {
    return matches[2];
  }
  return null;
}

function parseSection(input: string): Section | null {
  let matches = input.trim().match(SectionRegex);
  if (matches) {
    return { [matches[1]]: {} };
  }

  matches = input.trim().match(NamedSectionRegex);
  if (matches) {
    return { [`${matches[1]} ${matches[2]}`]: {} };
  }
  return null;
}

function parseNode(node: string, comment: string | null = null): { section: Section, jump: number } {
  const lines = node.split("\n");
  let currentSection: Section = {};
  if (comment) {
    currentSection.comment = comment;
  }

  let currentComment: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") {
      continue;
    }

    const comment = parseComment(line);
    if (comment) {
      currentComment = comment;
      continue;
    }

    const section = parseSection(line);
    if (section) {
      const { section: childSection, jump} = parseNode(lines.slice(i+1).join("\n"), currentComment);
      currentSection[line.replace(" {", "")] = childSection;
      i += jump+1;
      continue;
    }

    if (line === "}") {
      const jump = i;
      return { section: currentSection, jump };
    }

    const key_value = line.split(" ");
    const key = key_value[0];
    const value = key_value.length === 2 ? key_value[1] : true;
    currentSection[key] = value;
  }
  return { section: currentSection, jump: 0 };
}

export function parseConfig(conf: string): Config | null {
  const lines = conf.split("\n");
  let config = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const comment = parseComment(line);
    if (comment) {
      continue;
    }

    const section = parseSection(line);
    if (section) {
      const { section: childSection, jump} = parseNode(lines.slice(i+1).join("\n"), null);
      section[Object.keys(section)[0]] = childSection;
      config = { ...config, ...section };
      i += jump;
      continue;
    }
  }
  return config;
}
