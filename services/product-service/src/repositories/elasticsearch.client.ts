import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
  enableMetaHeader: false,
});

export const indexProduct = async (product: any) => {
  try {
    await esClient.index({
      index: 'products',
      id: product._id.toString(),
      document: {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        brand: product.brand,
        imageUrl: product.imageUrl,
        rating: product.rating,
      },
    }, {
      // 🚀 Her istekte başlığı zorla ezerek çift başlık oluşmasını engelliyoruz
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log(`[ES] Indexed product: ${product.name}`);
  } catch (err) {
    console.error('[ES] Indexing error:', err);
  }
};

export default esClient;
