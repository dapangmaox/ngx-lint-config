import {
  externalSchematic,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';

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
