import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';
import { Combobox, Transition } from '@headlessui/react';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  url?: string;
  metadata?: Record<string, any>;
  score?: number;
}

export interface SearchCategory {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}

interface AdvancedSearchProps {
  placeholder?: string;
  categories?: SearchCategory[];
  onSearch: (query: string, category?: string) => Promise<SearchResult[]>;
  onResultSelect: (result: SearchResult) => void;
  debounceMs?: number;
  maxResults?: number;
  showRecentSearches?: boolean;
  showSuggestions?: boolean;
  className?: string;
  disabled?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  placeholder = 'Search...',
  categories = [],
  onSearch,
  onResultSelect,
  debounceMs = 300,
  maxResults = 10,
  showRecentSearches = true,
  showSuggestions = true,
  className = '',
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches) {
      const saved = localStorage.getItem('lms-recent-searches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.warn('Failed to parse recent searches');
        }
      }
    }
  }, [showRecentSearches]);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!showRecentSearches || !searchQuery.trim()) return;
    
    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 5);
      localStorage.setItem('lms-recent-searches', JSON.stringify(updated));
      return updated;
    });
  }, [showRecentSearches]);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string, category?: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const searchResults = await onSearch(searchQuery, category);
      setResults(searchResults.slice(0, maxResults));
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onSearch, maxResults]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    setHighlightedIndex(-1);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim()) {
      setIsOpen(true);
      debounceRef.current = setTimeout(() => {
        performSearch(value, selectedCategory);
      }, debounceMs);
    } else {
      setResults([]);
      setLoading(false);
      setIsOpen(showRecentSearches && recentSearches.length > 0);
    }
  }, [performSearch, selectedCategory, debounceMs, showRecentSearches, recentSearches.length]);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    saveRecentSearch(query);
    onResultSelect(result);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    searchRef.current?.blur();
  }, [query, onResultSelect, saveRecentSearch]);

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback((recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery, selectedCategory);
    setIsOpen(true);
  }, [performSearch, selectedCategory]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = results.length + (showRecentSearches && !query ? recentSearches.length : 0);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (query && results.length > 0 && highlightedIndex < results.length) {
            handleResultSelect(results[highlightedIndex]);
          } else if (!query && recentSearches.length > 0) {
            const recentIndex = highlightedIndex - results.length;
            if (recentIndex >= 0 && recentIndex < recentSearches.length) {
              handleRecentSearchSelect(recentSearches[recentIndex]);
            }
          }
        } else if (query.trim()) {
          saveRecentSearch(query);
          performSearch(query, selectedCategory);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        searchRef.current?.blur();
        break;
    }
  }, [isOpen, highlightedIndex, results, recentSearches, query, handleResultSelect, handleRecentSearchSelect, saveRecentSearch, performSearch, selectedCategory, showRecentSearches]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    searchRef.current?.focus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 text-gray-900">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      {/* Search Input */}
      <div className="relative">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (query.trim()) {
                  performSearch(query, e.target.value);
                }
              }}
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-600 pr-8"
              disabled={disabled}
            >
              <option value="">All</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Search Icon */}
        <MagnifyingGlassIcon 
          className={`absolute ${categories.length > 0 ? 'left-20' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} 
        />
        
        {/* Input Field */}
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full py-3 pr-12 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${categories.length > 0 ? 'pl-24' : 'pl-10'}
          `}
          aria-label="Search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
        />
        
        {/* Clear Button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      <Transition
        show={isOpen && !disabled}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {showRecentSearches && !query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Recent Searches
              </div>
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchSelect(recentQuery)}
                  className={`
                    w-full flex items-center px-3 py-2 text-left hover:bg-gray-100 rounded-md transition-colors
                    ${highlightedIndex === results.length + index ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  `}
                >
                  <ClockIcon className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="truncate">{recentQuery}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-2">
              {!query || showRecentSearches && recentSearches.length > 0 ? (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-100">
                  Search Results
                </div>
              ) : null}
              
              {results.map((result, index) => {
                const category = categories.find(cat => cat.id === result.category);
                const isHighlighted = highlightedIndex === index;
                
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultSelect(result)}
                    className={`
                      w-full flex items-start px-3 py-3 text-left hover:bg-gray-100 rounded-md transition-colors
                      ${isHighlighted ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                    `}
                  >
                    {/* Category Icon */}
                    {category?.icon && (
                      <category.icon className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${category.color || 'text-gray-400'}`} />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="font-medium truncate">
                        {highlightText(result.title, query)}
                      </div>
                      
                      {/* Description */}
                      {result.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {highlightText(result.description, query)}
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      <div className="flex items-center mt-2">
                        <span className={`
                          inline-block px-2 py-1 text-xs rounded-full
                          ${category?.color ? 'bg-current/10 text-current' : 'bg-gray-100 text-gray-600'}
                        `}>
                          {category?.name || result.category}
                        </span>
                        
                        {/* Score */}
                        {result.score && (
                          <div className="flex items-center ml-2 text-xs text-gray-400">
                            <StarIcon className="w-3 h-3 mr-1" />
                            {Math.round(result.score * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {query && !loading && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </Transition>
    </div>
  );
};

export default AdvancedSearch;