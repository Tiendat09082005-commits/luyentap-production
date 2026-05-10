/**
 * Frontend Search SDK (Example)
 * Usage of Cursor-Based Pagination
 */

class SearchSDK {
  constructor(entity, isAdmin = false) {
    this.entity = entity; 
    this.basePath = isAdmin ? '/admin/search' : '/api/search'; 
    this.nextCursor = null;
    this.isFetching = false;
  }


  async fetchResults(keyword, isLoadMore = false, limit = 10) {
    if (this.isFetching && isLoadMore) return;
    this.isFetching = true;

    if (!isLoadMore) this.nextCursor = null;

    const url = new URL(`${window.location.origin}${this.basePath}/${this.entity}`);
    url.searchParams.append('keyword', keyword);
    url.searchParams.append('limit', limit);
    if (this.nextCursor) {
      url.searchParams.append('after', this.nextCursor);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.isFetching = false;
        return null;
      }
      const result = await response.json();

      if (result.success) {
        this.nextCursor = result.nextCursor;
        this.isFetching = false;
        return {
           items: result.data,
           hasMore: result.meta.hasMore
        };
      }
      this.isFetching = false;
      return null;
    } catch (err) {
      this.isFetching = false;
      console.error('Search failed:', err);
      return null;
    }
  }

  async suggest(keyword, extraParams = {}) {
    const url = new URL(`${window.location.origin}${this.basePath}/${this.entity}/suggest`);
    url.searchParams.append('keyword', keyword);
    for (const [key, value] of Object.entries(extraParams)) {
        if (value) url.searchParams.append(key, value);
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
          return [];
        }
        const result = await response.json();
        return result.success ? result.data : [];
    } catch (e) {
        return [];
    }
  }
}


// Example usage:
/*
const productSearch = new SearchSDK('products');

// 1. Initial Search
const firstPage = await productSearch.fetchResults('iphone');
renderProducts(firstPage.items);

// 2. Load More (Infinite Scroll)
if (firstPage.hasMore) {
    const secondPage = await productSearch.fetchResults('iphone', true);
    appendProducts(secondPage.items);
}
*/
