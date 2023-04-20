import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import stripJsonComments from 'strip-json-comments';

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
    trailingComma: 'none',
    bracketSameLine: true,
    printWidth: 80,
  };
}

export function updateESLintConfig(eslintJson: Record<string, any>) {
  eslintJson.overrides[0].extends = eslintJson.overrides[0].extends || [];
  eslintJson.overrides[0].extends.push('plugin:prettier/recommended');

  eslintJson.overrides[1].extends = eslintJson.overrides[1].extends || [];
  eslintJson.overrides[1].extends.push('plugin:prettier/recommended');

  return eslintJson;
}

export function updatePrettierConfig(prettierJson: Record<string, any>) {
  prettierJson.overrides = [
    {
      files: '*.html',
      options: {
        parser: 'angular',
      },
    },
  ];

  return prettierJson;
}

export function updateVSCodeExtensions(json: Record<string, any>) {
  json.recommendations = json.recommendations || [];
  json.recommendations.push('esbenp.prettier-vscode');
  json.recommendations.push('dbaeumer.vscode-eslint');

  return json;
}

export function addVSCodeSettings() {
  return {
    '[html]': {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': true,
      },
      'editor.formatOnSave': false,
    },
    '[typescript]': {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': true,
      },
      'editor.formatOnSave': false,
    },

    'eslint.options': {
      extensions: ['.ts', '.html'],
    },
    'eslint.validate': [
      'javascript',
      'javascriptreact',
      'typescript',
      'typescriptreact',
      'html',
    ],
  };
}
