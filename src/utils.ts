import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as stripJsonComments from 'strip-json-comments';

/**
 * This method is specifically for updating JSON in a Tree
 * @param path Path of JSON file in the Tree
 * @param callback Manipulation of the JSON data
 * @returns A rule which updates a JSON file file in a Tree
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function updateJsonInTree<T = any, O = T>(
  path: string,
  callback: (json: T, context: SchematicContext) => O,
): Rule {
  return (host: Tree, context: SchematicContext): Tree => {
    if (!host.exists(path)) {
      host.create(path, serializeJson(callback({} as T, context)));
      return host;
    }
    host.overwrite(
      path,
      serializeJson(callback(readJsonInTree(host, path), context)),
    );
    return host;
  };
}

function serializeJson(json: unknown): string {
  return `${JSON.stringify(json, null, 2)}\n`;
}

/**
 * This method is specifically for reading JSON files in a Tree
 * @param host The host tree
 * @param path The path to the JSON file
 * @returns The JSON data in the file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readJsonInTree<T = any>(host: Tree, path: string): T {
  if (!host.exists(path)) {
    throw new Error(`Cannot find ${path}`);
  }
  const contents = stripJsonComments(
    (host.read(path) as Buffer).toString('utf-8'),
  );
  try {
    return JSON.parse(contents);
  } catch (e) {
    throw new Error(
      `Cannot parse ${path}: ${e instanceof Error ? e.message : ''}`,
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
    bracketSameLine: false,
    printWidth: 80,
  };
}

export function updateESLintConfig(eslintJson: Record<string, any>) {
  eslintJson.overrides[0].extends = eslintJson.overrides[0].extends || [];
  eslintJson.overrides[0].extends.push('prettier');

  return eslintJson;
}

export function updateVSCodeExtensions(json: Record<string, any>) {
  json.recommendations = json.recommendations || [];
  json.recommendations.push('esbenp.prettier-vscode');
  json.recommendations.push('dbaeumer.vscode-eslint');

  return json;
}

export function readGitignoreAndWriteToPrettierignore(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const gitignorePath = '.gitignore';
    const prettierignorePath = '.prettierignore';

    // 读取 .gitignore 文件内容
    const gitignoreContent = tree.read(gitignorePath)?.toString('utf-8');

    if (!gitignoreContent) {
      _context.logger.error('.gitignore 文件不存在或为空');
      return tree;
    }

    // 将 .gitignore 内容写入 .prettierignore 文件
    tree.create(prettierignorePath, gitignoreContent);

    return tree;
  };
}

export function addOrUpdateVscodeSettings(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const settingsPath = '.vscode/settings.json';
    const configToAdd = {
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': 'explicit',
      },
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'editor.formatOnSave': true,
    };

    let settingsContent = tree.read(settingsPath)?.toString('utf-8');
    let settingsJson = {};

    // 如果 settings.json 文件已存在，则尝试解析其内容
    if (settingsContent) {
      try {
        settingsJson = JSON.parse(settingsContent);
      } catch (error) {
        _context.logger.error(`解析 ${settingsPath} 文件出错: ${error}`);
      }
    }

    // 合并配置项
    settingsJson = { ...settingsJson, ...configToAdd };

    // 将配置项转为 JSON 格式
    const updatedSettingsContent = JSON.stringify(settingsJson, null, 2);

    // 将更新后的配置写入文件
    tree.create(settingsPath, updatedSettingsContent);

    return tree;
  };
}

