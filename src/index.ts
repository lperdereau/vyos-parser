import { parseConfig } from './parser';
import type { Config, QuotedString, Value, Section } from './parser';
import { generateConfig } from './generator';

export {
    parseConfig,
    generateConfig,
    Config,
    QuotedString,
    Value,
    Section,
}
