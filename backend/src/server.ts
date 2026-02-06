import express from 'express';
import cors from 'cors';
import { env, connectDatabase } from './config';
import { errorHandler, rateLimiter } from './middlewares';
import routes from './routes';

const app = express();

// Trust proxy - Required for rate limiting behind reverse proxies (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        await connectDatabase();

        app.listen(parseInt(env.PORT, 10), () => {
            console.log(`🚀 Server running on http://localhost:${env.PORT}`);
            console.log(`📚 API available at http://localhost:${env.PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
