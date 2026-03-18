import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

const pinoLogger = pino({
  level: logLevel,
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export function getLogger(name: string) {
  return pinoLogger.child({ module: name });
}

export default pinoLogger;
