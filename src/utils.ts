import {
  chain,
  externalSchematic,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import * as stripJsonComments from 'strip-json-comments';

const packageJSON = require('../package.json');

/**
 *
 * @param _options
 * @returns run @angular-eslint/schematics
 */
export function addESLintToProject(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    const rule = externalSchematic(
      '@angular-eslint/schematics',
      'ng-add',
      _options
    );

    return rule;
  };
}

export function addPrettierToProject(_options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const projectPackageJSON = (tree.read('package.json') as Buffer).toString(
      'utf-8'
    );

    const json = JSON.parse(projectPackageJSON);
    json.devDependencies = json.devDependencies || {};

    json.devDependencies['eslint-config-prettier'] =
      packageJSON.devDependencies['eslint-config-prettier'];
    json.devDependencies['eslint-plugin-prettier'] =
      packageJSON.devDependencies['eslint-plugin-prettier'];
    json.devDependencies['prettier'] = packageJSON.devDependencies['prettier'];

    tree.overwrite('package.json', JSON.stringify(json, null, 2));

    context.addTask(new NodePackageInstallTask());

    context.logger.info(
      'Prettier dependencies have been successfully installed'
    );

    return tree;
  };
}

export function applyPrettierConfigToProject() {
  return (_tree: Tree, context: SchematicContext) => {
    context.logger.info('Adding prettier config to project...');
    return chain([
      updateJsonInTree('.prettierrc.json', () => createPrettierConfig()),
      updateJsonInTree('.eslintrc.json', (json) => updateESLintConfig(json)),
    ]);
  };
}

/**
 * This method is specifically for updating JSON in a Tree
 * @param path Path of JSON file in the Tree
 * @param callback Manipulation of the JSON data
 * @returns A rule which updates a JSON file file in a Tree
 */
export function updateJsonInTree<T = any, O = T>(
  path: string,
  callback: (json: T, context: SchematicContext) => O
): Rule {
  return (tree: Tree, context: SchematicContext): Tree => {
    if (!tree.exists(path)) {
      tree.create(path, serializeJson(callback({} as T, context)));
      return tree;
    }
    tree.overwrite(
      path,
      serializeJson(callback(readJsonInTree(tree, path), context))
    );
    return tree;
  };
}

function serializeJson(json: unknown): string {
  return `${JSON.stringify(json, null, 2)}\n`;
}

/**
 * This method is specifically for reading JSON files in a Tree
 * @param tree The tree tree
 * @param path The path to the JSON file
 * @returns The JSON data in the file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readJsonInTree<T = any>(tree: Tree, path: string): T {
  if (!tree.exists(path)) {
    throw new Error(`Cannot find ${path}`);
  }
  const contents = stripJsonComments(
    (tree.read(path) as Buffer).toString('utf-8')
  );
  try {
    return JSON.parse(contents);
  } catch (e) {
    throw new Error(
      `Cannot parse ${path}: ${e instanceof Error ? e.message : ''}`
    );
  }
}

export function createPrettierConfig() {
  return {
    tabWidth: 2,
    useTabs: false,
    singleQuote: true,
    semi: true,
    bracketSpacing: true,
    arrowParens: 'avoid',
    trailingComma: 'es5',
    bracketSameLine: true,
    printWidth: 80,
  };
}

export function updateESLintConfig(eslintJson: Record<string, any>) {
  eslintJson.overrides[0].extends = eslintJson.overrides[0].extends || [];
  eslintJson.overrides[0].extends.push('plugin:prettier/recommended');

  return eslintJson;
}
