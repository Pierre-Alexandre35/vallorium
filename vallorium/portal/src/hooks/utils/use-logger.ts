import { useMemo } from 'react';
import { Logger } from 'src/utils';

export const useLogger = (...options: ConstructorParameters<typeof Logger>) => {
  return useMemo(() => new Logger(...(options || [])), [options]);
};
