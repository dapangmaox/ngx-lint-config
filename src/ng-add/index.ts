import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { addESLintToProject } from '../utils';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function ngAdd(_options: any): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    _context.logger.info('ng-add is running...');

    return chain([addESLintToProject]);
  };
}
