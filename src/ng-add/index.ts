import {
  chain,
  externalSchematic,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  createPrettierConfig,
  updateESLintConfig,
  updateJsonInTree,
} from '../utils';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function ngAdd(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    _context.logger.info('ng-add is running...');

    return chain([
      addESLintToProject,
      addPrettierToProject,
      applyPrettierConfigToProject,
    ]);
  };
}

const packageJSON = require('../package.json');

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
