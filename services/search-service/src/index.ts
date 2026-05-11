import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SearchController } from './controllers/search.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.get('/', SearchController.search);

app.listen(PORT, () => {
  console.log(`🔍 Search Service running on http://localhost:${PORT}`);
});
