async function main() {
  try {
    const res = await fetch('http://localhost:8080/products?limit=20&page=1');
    console.log('API Status:', res.status);
    const data = await res.json();
    console.log('Products returned:', data?.data?.products?.length);
    console.log(data?.data?.products?.map(p => ({
      id: p.id,
      name: p.name,
      isActive: p.isActive,
      approvalStatus: p.approvalStatus,
      userId: p.userId,
      sellerName: p.sellerName
    })));
  } catch (err) {
    console.error('Error fetching from gateway:', err.message);
  }
}

main();
