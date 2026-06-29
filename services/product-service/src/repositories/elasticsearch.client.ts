import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  enableMetaHeader: false,
});

export const initElasticsearch = async () => {
  try {
    const exists = await esClient.indices.exists({ index: 'products' });
    if (!exists) {
      await esClient.indices.create({ index: 'products' });
      console.log('[ES] Created "products" index successfully');
    }
  } catch (err) {
    console.error('[ES] Failed to check/create products index:', err);
  }
};

export const indexProduct = async (product: any) => {
  try {
    await esClient.index({
      index: 'products',
      id: product.id.toString(),
      document: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.categoryName || '',
        brand: product.brandName || '',
        imageUrl: product.imageUrl,
        rating: product.rating,
        sourceType: 'DATABASE',
        userId: product.userId || 'admin-user-001',
        categoryAttributes: product.categoryAttributes || {},
      },
    });
    console.log(`[ES] Indexed product: ${product.name}`);
  } catch (err) {
    console.error('[ES] Indexing error:', err);
  }
};

export const syncXmlProductsToSearch = async (xmlProducts: any[], userId: string) => {
  try {
    // 1. Delete previous XML products from index for ONLY this userId
    try {
      await esClient.deleteByQuery({
        index: 'products',
        conflicts: 'proceed',
        query: {
          bool: {
            must: [
              { match: { sourceType: 'XML_REQUEST' } },
              { match: { userId: userId } }
            ]
          }
        }
      });
      console.log(`[ES] Cleared previous XML products for user ${userId} from search index`);
    } catch (err) {
      console.log('[ES] deleteByQuery info (probably first run):', err);
    }

    if (xmlProducts.length === 0) return;

    // 2. Prepare bulk indexing operations
    const operations: any[] = [];
    for (const product of xmlProducts) {
      operations.push({ index: { _index: 'products', _id: product._id } });
      operations.push({
        id: product._id,
        name: product.name,
        description: `XML Urunu. Barkod: ${product.barcode}. Marka: ${product.brand}`,
        price: product.price,
        category: product.category || '',
        brand: product.brand || '',
        imageUrl: product.imageUrl,
        rating: product.rating || 4.5,
        sourceType: 'XML_REQUEST',
        barcode: product.barcode,
        stock: product.stock,
        userId: userId,
        categoryAttributes: product.categoryAttributes || {}
      });
    }

    // 3. Perform bulk indexing
    const response = await esClient.bulk({ refresh: true, operations });
    if (response.errors) {
      console.error(`[ES] Bulk indexing XML products had errors for user ${userId}`);
    } else {
      console.log(`[ES] Bulk indexed ${xmlProducts.length} XML products successfully for user ${userId}`);
    }
  } catch (error) {
    console.error(`[ES] Failed to sync XML products for user ${userId} to search index:`, error);
  }
};

export const getCategoryFilters = async (category: string) => {
  try {
    const response = await esClient.search({
      index: 'products',
      size: 0,
      query: {
        match_phrase: { category }
      },
      // Unfortunately we don't have dynamic mapping for nested categoryAttributes to do perfect terms aggregation dynamically easily without mapping changes,
      // but we can pull a sample of 500 products and aggregate in memory to be safe and avoid mapping errors.
    });
    // Let's use memory aggregation for up to 1000 items in that category to avoid ES dynamic mapping nested aggregation complexities.
    const searchRes = await esClient.search({
      index: 'products',
      size: 1000,
      query: {
        match_phrase: { category }
      },
      _source: ['categoryAttributes', 'brand']
    });

    const hits = searchRes.hits.hits as any[];
    const filters: Record<string, Set<string>> = {};
    const brands = new Set<string>();

    for (const hit of hits) {
      const src = hit._source;
      if (src.brand) brands.add(src.brand);
      
      if (src.categoryAttributes) {
        for (const [key, val] of Object.entries(src.categoryAttributes)) {
          if (!filters[key]) filters[key] = new Set();
          if (typeof val === 'string' && val.trim() !== '') {
            filters[key].add(val.trim());
          }
        }
      }
    }

    const formattedFilters = Object.keys(filters).map(key => ({
      name: key,
      options: Array.from(filters[key]).slice(0, 50) // limit to 50 options per filter
    }));

    return {
      brands: Array.from(brands),
      attributes: formattedFilters
    };
  } catch (err) {
    console.error(`[ES] Error fetching filters for category ${category}:`, err);
    return { brands: [], attributes: [] };
  }
};

export default esClient;
