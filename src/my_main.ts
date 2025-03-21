const vyattaConfig = `
/* Vyatta configuration */
interfaces {
  /* Ethernet interface */
  ethernet eth0 {

    address 192.168.1.1/24
  }
}
system {
  host-name vyatta
}
protocols {
  static {
    route 0.0.0.0/0 {
      next-hop 192.168.1.254
    }
  }
}
`;

type Config = {
  [key: string]: Section;
};

type QuotedString = string;

type Value = QuotedString | string | number | boolean;

type Section = { comment?: string } & {
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

function parseNode(node: string, comment: string | null): { section: Section, jump: number } {
  // Parse each line to determine kind of node
  // use respectiv parse method to determine value type
  // A section is determined by the presence of a `{` and ends with a `}`, not on the same line, forming a block
  // A value is determined by the presence of a `key value` pair
  // A comment is determined by the presence of `/*` and `*/` on the same line

  // Find section start, run recursively until section end
  // return function to parent

  // Find value, return value
  // Find comment, return comment

  const lines = node.split("\n");
  let currentSection: Section = {};
  let currentComment: string | null = comment;

  if (currentComment) {
    currentSection.comment = currentComment;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const comment = parseComment(line);
    if (comment) {
      currentComment = comment;
      continue;
    }

    const section = parseSection(line);
    if (section) {
      const { section: childSection, jump} = parseNode(lines.slice(i+1).join("\n"), currentComment);
      currentSection[line.replace(" {", "")] = childSection;
      i += jump;
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

console.log(parseValue("duplex auto"));
console.log(parseValue("a"));

console.log(parseComment("/* Ethernet interface */"));
console.log(parseComment("a"));

console.log(parseSection("      interfaces {    "));
const test = `protocols {
  static {
    /* Default route */
    route 0.0.0.0/0 {
      next-hop 192.168.1.254
    }
  }
}`;
console.log(JSON.stringify(parseNode(test, null).section));
