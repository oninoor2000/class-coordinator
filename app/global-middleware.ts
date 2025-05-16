import { registerGlobalMiddleware } from '@tanstack/react-start';
import { logMiddleware } from './lib/middleware/loggingMiddleware';

registerGlobalMiddleware({
  middleware: [logMiddleware],
});
