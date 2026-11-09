/**
 * VTU Provider Registry
 */

import { BigiSubProvider, bigiSubProvider } from './bigisub';
import { IVtuProvider } from '../vtuProvider';

const providers: Record<string, IVtuProvider> = {
  bigisub: bigiSubProvider,
};

export function getVtuProvider(code: string = 'bigisub'): IVtuProvider {
  return providers[code] || bigiSubProvider;
}

export { BigiSubProvider, bigiSubProvider };
