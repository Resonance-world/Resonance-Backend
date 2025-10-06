import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    userId?: string;
    user?: any;
}
export declare const sessionAuthMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export {};
//# sourceMappingURL=sessionAuth.d.ts.map