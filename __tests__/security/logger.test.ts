import { logger } from '../../src/lib/logger';

describe('Logger: Google Cloud Structured Logging', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('formats logs as JSON in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    logger.info('Test message', { key: 'value' });

    expect(consoleSpy).toHaveBeenCalled();
    const lastCall = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(lastCall);
    
    expect(parsed.message).toBe('Test message');
    expect(parsed.severity).toBe('INFO');
    expect(parsed.key).toBe('value');
    expect(parsed.timestamp).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('formats logs as human-readable in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    logger.error('Error message');

    expect(consoleSpy).toHaveBeenCalled();
    const lastCall = consoleSpy.mock.calls[0][0];
    expect(lastCall).toContain('[ERROR]');
    expect(lastCall).toContain('Error message');

    process.env.NODE_ENV = originalEnv;
  });
});
