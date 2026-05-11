import { Request, Response } from 'express';
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  enableMetaHeader: false,
});

export const SearchController = {
  async search(req: Request, res: Response) {
    try {
      const { q } = req.query;
      console.log(`[Search] 🔍 Query received: "${q}"`);
      
      if (!q) {
        return res.json({ success: true, data: [] });
      }

      const result = await esClient.search({
        index: 'products',
        query: {
          multi_match: {
            query: q as string,
            fields: ['name^3', 'description', 'brand^2', 'category'],
            fuzziness: 'AUTO'
          }
        }
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      const products = result.hits.hits.map(hit => hit._source);
      console.log(`[Search] ✅ Found ${products.length} results for "${q}"`);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
