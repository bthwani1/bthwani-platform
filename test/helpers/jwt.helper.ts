import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../src/core/strategies/jwt.strategy';

const TEST_SECRET = 'test-secret-key-for-e2e-tests';
const TEST_ALG = 'HS256';

export function generateTestToken(payload: Partial<JwtPayload> = {}): string {
  const defaultPayload: JwtPayload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    roles: ['user'],
    ...payload,
  };

  return jwt.sign(defaultPayload, TEST_SECRET, {
    algorithm: TEST_ALG,
    expiresIn: '1h',
  });
}

export function generateCustomerToken(
  customerId: string,
  roles: string[] = ['user', 'customer'],
): string {
  return generateTestToken({
    sub: customerId,
    roles,
  });
}

export function generateCaptainToken(captainId: string): string {
  return generateTestToken({
    sub: captainId,
    roles: ['captain'],
  });
}

export function generatePartnerToken(partnerId: string): string {
  return generateTestToken({
    sub: partnerId,
    roles: ['partner'],
  });
}
