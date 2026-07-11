import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { APP_VERSION, PORT } from './config';
import router from './routes';
// <<FEATURE_IMPORTS>>

const app = express();

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// <<FEATURE_INIT>>

app.get('/api/version', (_req, res) => {
  res.json({ version: APP_VERSION });
});

app.use('/api', router);
// <<FEATURE_ROUTES>>

// <<SERVER_ONLY_STATIC>>
// <<PWA_SW_ROUTE>>

app.listen(PORT, () => {
  console.log('<<PROJECT_TITLE>> v' + APP_VERSION + ' listening on port ' + PORT);
});
