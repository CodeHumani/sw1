import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors'; 
import authRoutes from '../routes/auth.routes.js';
import salaRoutes from '../routes/sala.routes.js';
import usersalaRoutes from '../routes/usersala.routes.js';
import crearPaginaRoutes from '../routes/crearPagina.routes.js';
import aiRoutes from '../routes/ai.routes.js';
import { FRONTEND_URLS } from '../config.js';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (FRONTEND_URLS.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use("/apis", authRoutes);

app.use("/apis/sala", salaRoutes);

app.use("/apis/usersala", usersalaRoutes);

app.use('/apis/crearPagina', crearPaginaRoutes);

app.use('/apis/ai', aiRoutes);

export default app;
