const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const targetRoot = path.join(projectRoot, 'frontend', 'src');
const scopedDirs = [
  path.join(targetRoot, 'components', 'ui'),
  path.join(targetRoot, 'components', 'dialogs'),
];

const fileExtensions = new Set(['.ts', '.tsx']);
const ignoredDirs = new Set(['node_modules', 'dist', 'themexx']);
const forbiddenClassTokens = [
  'w-',
  'h-',
  'p-',
  'px-',
  'py-',
  'pt-',
  'pr-',
  'pb-',
  'pl-',
  'rounded-',
  'border-',
];

const semiComponentNames = [
  'Button',
  'Modal',
  'Dialog',
  'Banner',
  'Tooltip',
  'Select',
  'Input',
  'TextArea',
  'Table',
  'Card',
  'Tag',
];

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if (fileExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasForbiddenClassName(classValue) {
  const classTokens = classValue
    .split(/\s+/)
    .map((v) => v.trim())
    .filter(Boolean);
  return classTokens.some((classToken) =>
    forbiddenClassTokens.some((token) => classToken.startsWith(token))
  );
}

function main() {
  const files = scopedDirs.flatMap((dir) => walk(dir));
  const violations = [];

  const tagPattern = new RegExp(`<(${semiComponentNames.join('|')})\\b[^>]*>`, 'g');

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!tagPattern.test(line)) {
        continue;
      }

      const classMatch = line.match(/className\s*=\s*"([^"]+)"/);
      if (!classMatch) {
        continue;
      }

      const classValue = classMatch[1];
      if (hasForbiddenClassName(classValue)) {
        violations.push({
          file: path.relative(projectRoot, file),
          line: i + 1,
          classValue,
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log('Semi override check passed.');
    process.exit(0);
  }

  console.error('Semi override check failed. Forbidden classes on Semi components:');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} -> ${v.classValue}`);
  }
  process.exit(1);
}

main();
