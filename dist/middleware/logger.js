export const logger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.originalUrl;
        const status = res.statusCode;
        const userAgent = req.get('User-Agent') || '';
        const ip = req.ip || req.connection.remoteAddress;
        console.log(`${timestamp} - ${method} ${url} ${status} ${duration}ms - ${ip} - ${userAgent}`);
    });
    next();
};
//# sourceMappingURL=logger.js.map