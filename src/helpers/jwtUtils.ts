import { jwtDecode } from 'jwt-decode';

import { JwtHeader, JwtPayload, SIOPErrors } from '../types';

export type JwtType = 'id-token' | 'request-object';

export function parseJWT(jwt: string) {
  const header = jwtDecode<JwtHeader>(jwt, { header: true });
  const payload = jwtDecode<JwtPayload>(jwt, { header: false });

  if (!payload || !header) {
    throw new Error(SIOPErrors.NO_JWT);
  }
  return { header, payload };
}
