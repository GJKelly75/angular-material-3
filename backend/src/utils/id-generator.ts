import { customAlphabet } from 'nanoid';

export class IdGenerator {
  private static readonly PLATFORM_ID_PREFIX = {
    administrator: 'ADM',
    coach: 'COH',
    participant: 'TCH'
  };

  private static readonly nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

  static generatePlatformId(role: 'administrator' | 'coach' | 'participant'): string {
    const prefix = this.PLATFORM_ID_PREFIX[role];
    const uniqueId = this.nanoid();
    return `${prefix}-${uniqueId}`;
  }
}
