/* eslint-disable @typescript-eslint/no-namespace */

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
    validated?: Record<string, unknown>;
  }
}
