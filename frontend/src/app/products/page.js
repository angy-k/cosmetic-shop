"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import ProductCard from "../../components/ProductCard";
import Pagination from "../../components/Pagination";
import { useTranslation } from "../../contexts/LanguageContext";
import { API_URL } from "../../lib/apiUrl";

const CATEGORIES = ['skincare', 'makeup', 'haircare', 'fragrance', 'bodycare', 'tools', 'sets', 'other'];

const EMPTY_FILTERS = { search: '', category: '', brand: '', minPrice: '', maxPrice: '', sort: '-createdAt' };

export default function ProductsPage() {
  const { t, plural } = useTranslation();
  const { isAdmin, apiCall } = useAuth();

  // Sort option labels depend on the active language, so this lives inside
  // the component (re-computed each render) instead of at module scope.
  const SORT_OPTIONS = [
    { value: '-createdAt', label: t('productsPage.sortNewest') },
    { value: 'price', label: t('productsPage.sortPriceLowHigh') },
    { value: '-price', label: t('productsPage.sortPriceHighLow') },
    { value: '-rating', label: t('productsPage.sortTopRated') }
  ];
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  // Applied filters (what was actually searched) vs draft filters (what's in the form,
  // not yet applied) - keeps typing in the price fields from re-fetching on every keystroke
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);

  const buildQuery = (activeFilters, page) => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', '12');
    if (activeFilters.search.trim()) params.set('search', activeFilters.search.trim());
    if (activeFilters.category) params.set('category', activeFilters.category);
    if (activeFilters.brand) params.set('brand', activeFilters.brand);
    if (activeFilters.minPrice) params.set('minPrice', activeFilters.minPrice);
    if (activeFilters.maxPrice) params.set('maxPrice', activeFilters.maxPrice);
    if (activeFilters.sort) params.set('sort', activeFilters.sort);
    return params.toString();
  };

  const fetchProducts = useCallback(async (activeFilters, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(`${API_URL}/api/products?${buildQuery(activeFilters, page)}`);

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setProducts(data.data.items);
          setPagination(data.data.pagination);
        } else {
          throw new Error(data.message || 'Failed to fetch products');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    setMounted(true);
    fetchProducts(EMPTY_FILTERS, 1);

    apiCall(`${API_URL}/api/products/brands`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setBrands(data.data.brands);
      })
      .catch(err => console.error('Error fetching brands:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setFilters(draftFilters);
    fetchProducts(draftFilters, 1);
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
    fetchProducts(EMPTY_FILTERS, 1);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchProducts(filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => key !== 'sort' && value);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          {t('productsPage.title')}
        </h1>
        {mounted && isAdmin && (
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {t('productsPage.addNewProduct')}
          </Link>
        )}
      </div>

      {/* Filters */}
      <form onSubmit={handleApplyFilters} className="mb-8 p-4 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder={t('productsPage.searchPlaceholder')}
            value={draftFilters.search}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, search: e.target.value }))}
            className="lg:col-span-2 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />

          <select
            value={draftFilters.category}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 capitalize"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <option value="">{t('productsPage.allCategories')}</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c} className="capitalize">{t(`product.categories.${c}`)}</option>
            ))}
          </select>

          <select
            value={draftFilters.brand}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, brand: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <option value="">{t('productsPage.allBrands')}</option>
            {brands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              placeholder={t('productsPage.minPrice')}
              value={draftFilters.minPrice}
              onChange={(e) => setDraftFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
            <input
              type="number"
              min="0"
              placeholder={t('productsPage.maxPrice')}
              value={draftFilters.maxPrice}
              onChange={(e) => setDraftFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>

          <select
            value={draftFilters.sort}
            onChange={(e) => setDraftFilters(prev => ({ ...prev, sort: e.target.value }))}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            {t('productsPage.applyFilters')}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-md text-sm font-medium border hover:opacity-90 transition-opacity"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              {t('productsPage.clearFilters')}
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{t('productsPage.errorLoading', { error })}</p>
          <button
            onClick={() => fetchProducts(filters, pagination.page)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--muted)' }}>
            {t('productsPage.noProductsFound')}{hasActiveFilters ? ` ${t('productsPage.noProductsFoundFiltered')}` : '.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-4 text-sm underline"
              style={{ color: 'var(--brand)' }}
            >
              {t('productsPage.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {t('productsPage.productsFound', { count: pagination.total, word: plural('product', pagination.total) })}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
