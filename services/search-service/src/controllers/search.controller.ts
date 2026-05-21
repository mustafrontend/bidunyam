import { Request, Response } from 'express';
import { Client } from '@elastic/elasticsearch';
import { saveSearchQuery, getRecentSearches } from '../utils.searchHistory';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  enableMetaHeader: false,
});

export const SearchController = {
  async search(req: Request, res: Response) {
    try {
      const { q, userId } = req.query;
      console.log(`[Search] 🔍 Query received: "${q}"`);

      if (!q) {
        // Kullanıcıya özel öneriler
        let recentSearches: string[] = [];
        let recommended: any[] = [];
        if (userId) {
          recentSearches = await getRecentSearches(userId as string);
          // Son aramalara göre öneri (örnek: son aranan kelimelerden ürün çek)
          if (recentSearches.length > 0) {
            const recResult = await esClient.search({
              index: 'products',
              query: {
                multi_match: {
                  query: recentSearches.join(' '),
                  fields: ['name^3', 'description', 'brand^2', 'category'],
                  fuzziness: 'AUTO'
                }
              },
              size: 10
            });
            recommended = recResult.hits.hits.map(hit => hit._source);
          }
        }
        return res.json({ success: true, data: [], recommended, recentSearches });
      }

      // Arama sorgusunu Redis'e kaydet
      if (userId) {
        await saveSearchQuery(userId as string, q as string);
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
      });

      const products = result.hits.hits.map(hit => hit._source);
      console.log(`[Search] ✅ Found ${products.length} results for "${q}"`);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
