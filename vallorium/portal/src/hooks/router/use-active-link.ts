import { useMatch } from 'react-router-dom';

type ReturnType = boolean;

export function useActiveLink(path: string): ReturnType {
  return !!useMatch({ path, end: false });
}
