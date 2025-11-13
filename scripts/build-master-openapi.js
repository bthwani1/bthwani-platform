#!/usr/bin/env node

/**
 * Build the master OpenAPI contract by merging all per-service specifications.
 *
 * The script reads the `oas/master/Master_OpenAPI.yaml` file, inspects the
 * `x-built-from` list to locate service specs, merges paths/components/tags, and
 * rewrites the master file. Run with `--check` to exit non-zero when the current
 * file is out of date instead of updating it.
 */

const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const YAML = require('yaml');

const projectRoot = path.resolve(__dirname, '..');
const masterPath = path.join(projectRoot, 'oas', 'master', 'Master_OpenAPI.yaml');

const CHECK_MODE = process.argv.includes('--check');

function readYaml(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return YAML.parse(content);
  } catch (error) {
    throw new Error(`Failed to read YAML file at ${filePath}: ${error.message}`);
  }
}

function ensureObject(value, name) {
  if (!value || typeof value !== 'object') {
    throw new Error(`Expected ${name} to be an object.`);
  }
  return value;
}

function createBaseDocument(masterDoc) {
  const base = {};

  const preservedKeys = [
    'openapi',
    'info',
    'servers',
    'externalDocs',
    'security',
    'tags',
    'x-built-from',
  ];

  for (const key of Object.keys(masterDoc)) {
    if (preservedKeys.includes(key)) {
      base[key] = masterDoc[key];
    }
  }

  base.paths = {};
  base.components = {};
  base.tags = Array.isArray(base.tags) ? [...base.tags] : [];

  return base;
}

function mergeTags(target, source, context) {
  if (!Array.isArray(source)) {
    return;
  }

  const known = new Map(target.map((tag) => [tag.name, tag]));

  for (const tag of source) {
    if (!tag || typeof tag !== 'object' || typeof tag.name !== 'string') {
      throw new Error(`Invalid tag definition in ${context}`);
    }

    if (known.has(tag.name)) {
      const existing = known.get(tag.name);
      if (!isDeepStrictEqual(existing, tag)) {
        throw new Error(`Tag conflict detected for "${tag.name}" in ${context}`);
      }
      continue;
    }

    target.push(tag);
    known.set(tag.name, tag);
  }
}

function mergeNamedArray(target, source, context) {
  if (!Array.isArray(source) || source.length === 0) {
    return target;
  }

  const map = new Map();

  if (Array.isArray(target)) {
    for (const item of target) {
      const key = deriveParameterKey(item, context);
      map.set(key, item);
    }
  }

  const result = Array.isArray(target) ? [...target] : [];

  for (const entry of source) {
    const key = deriveParameterKey(entry, context);
    if (map.has(key)) {
      const existing = map.get(key);
      if (!isDeepStrictEqual(existing, entry)) {
        throw new Error(`Parameter conflict for "${key}" in ${context}`);
      }
    } else {
      map.set(key, entry);
      result.push(entry);
    }
  }

  return result;
}

function deriveParameterKey(entry, context) {
  if (!entry || typeof entry !== 'object') {
    throw new Error(`Invalid parameter definition in ${context}`);
  }

  if (typeof entry.$ref === 'string') {
    return `ref:${entry.$ref}`;
  }

  if (typeof entry.name === 'string' && typeof entry.in === 'string') {
    return `${entry.in}:${entry.name}`;
  }

  throw new Error(`Invalid parameter definition in ${context}`);
}

function mergeComponents(target, source, context) {
  if (!source) {
    return;
  }

  for (const [section, entries] of Object.entries(source)) {
    if (!target[section]) {
      target[section] = {};
    }

    const sectionTarget = ensureObject(target[section], `${context}.components.${section}`);
    const sectionSource = ensureObject(entries, `${context}.components.${section}`);

    for (const [name, schema] of Object.entries(sectionSource)) {
      if (sectionTarget[name]) {
        if (!isDeepStrictEqual(sectionTarget[name], schema)) {
          throw new Error(`Component conflict for "${section}.${name}" in ${context}`);
        }
      } else {
        sectionTarget[name] = schema;
      }
    }
  }
}

function mergePaths(target, source, context) {
  if (!source) {
    return;
  }

  for (const [route, definition] of Object.entries(source)) {
    if (!target[route]) {
      target[route] = {};
    }

    const targetRoute = ensureObject(target[route], `${context}.paths.${route}`);
    const sourceRoute = ensureObject(definition, `${context}.paths.${route}`);

    for (const [key, value] of Object.entries(sourceRoute)) {
      if (key === 'parameters') {
        targetRoute.parameters = mergeNamedArray(targetRoute.parameters, value, `${context}.paths.${route}`);
        continue;
      }

      if (targetRoute[key]) {
        if (!isDeepStrictEqual(targetRoute[key], value)) {
          throw new Error(`Path conflict for "${route}" key "${key}" in ${context}`);
        }
      } else {
        targetRoute[key] = value;
      }
    }
  }
}

function buildMasterContract() {
  if (!fs.existsSync(masterPath)) {
    throw new Error(`Master OpenAPI file not found at ${masterPath}`);
  }

  const masterDoc = readYaml(masterPath);
  ensureObject(masterDoc, 'Master OpenAPI document');

  const sources = masterDoc['x-built-from'];
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error('Master OpenAPI document must declare non-empty "x-built-from" array.');
  }

  const aggregate = createBaseDocument(masterDoc);

  sources.forEach((relativePath) => {
    const absolutePath = path.resolve(path.dirname(masterPath), relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Referenced OpenAPI file not found: ${absolutePath}`);
    }

    const serviceDoc = readYaml(absolutePath);
    ensureObject(serviceDoc, `Service contract ${relativePath}`);

    mergeTags(aggregate.tags, serviceDoc.tags, relativePath);
    mergePaths(aggregate.paths, serviceDoc.paths, relativePath);
    mergeComponents(aggregate.components, serviceDoc.components, relativePath);
  });

  return aggregate;
}

function removeEmptyComponentSections(components) {
  for (const key of Object.keys(components)) {
    if (components[key] && Object.keys(components[key]).length === 0) {
      delete components[key];
    }
  }
}

function main() {
  try {
    const existingContent = fs.existsSync(masterPath) ? fs.readFileSync(masterPath, 'utf8') : null;
    const existingDoc = existingContent ? YAML.parse(existingContent) : null;

    const aggregate = buildMasterContract();
    removeEmptyComponentSections(aggregate.components);

    if (CHECK_MODE && existingDoc && typeof existingDoc['x-generated-at'] === 'string') {
      aggregate['x-generated-at'] = existingDoc['x-generated-at'];
    } else {
      aggregate['x-generated-at'] = new Date().toISOString();
    }

    const output = YAML.stringify(aggregate, {
      lineWidth: 0,
      sortMapEntries: false,
    });

    if (CHECK_MODE) {
      if (!existingContent || existingContent.trim() !== output.trim()) {
        console.error('Master OpenAPI document is out of date. Run `npm run build:openapi`.');
        process.exit(1);
      }
      console.log('Master OpenAPI document is up to date.');
      return;
    }

    fs.writeFileSync(masterPath, output, 'utf8');
    console.log(`Master OpenAPI document rebuilt at ${masterPath}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();


