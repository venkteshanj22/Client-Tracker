import React, { useState } from 'react';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';

const SearchAndFilter = ({ 
  searchTerm, 
  onSearchChange, 
  filters, 
  onFilterChange, 
  sortBy, 
  sortOrder, 
  onSortChange,
  columns = [],
  filterOptions = {}
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleClearFilters = () => {
    onSearchChange('');
    Object.keys(filters).forEach(key => {
      onFilterChange(key, '');
    });
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some(v => v);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search clients, companies, contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
            showFilters || hasActiveFilters
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
              {Object.values(filters).filter(v => v).length + (searchTerm ? 1 : 0)}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Stage Filter */}
            {filterOptions.stages && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={filters.stage || ''}
                  onChange={(e) => onFilterChange('stage', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Stages</option>
                  {filterOptions.stages.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Industry Filter */}
            {filterOptions.industries && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  value={filters.industry || ''}
                  onChange={(e) => onFilterChange('industry', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Industries</option>
                  {filterOptions.industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Company Size Filter */}
            {filterOptions.companySizes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                <select
                  value={filters.company_size || ''}
                  onChange={(e) => onFilterChange('company_size', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sizes</option>
                  {filterOptions.companySizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Assigned BDE Filter */}
            {filterOptions.bdes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned BDE</label>
                <select
                  value={filters.assigned_bde || ''}
                  onChange={(e) => onFilterChange('assigned_bde', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All BDEs</option>
                  {filterOptions.bdes.map((bde) => (
                    <option key={bde.id} value={bde.id}>
                      {bde.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.date_range || ''}
                onChange={(e) => onFilterChange('date_range', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            {/* Budget Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
              <select
                value={filters.budget_range || ''}
                onChange={(e) => onFilterChange('budget_range', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Budget</option>
                <option value="0-10000">$0 - $10K</option>
                <option value="10000-50000">$10K - $50K</option>
                <option value="50000-100000">$50K - $100K</option>
                <option value="100000-500000">$100K - $500K</option>
                <option value="500000+">$500K+</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value, sortOrder)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">Date Created</option>
            <option value="company_name">Company Name</option>
            <option value="last_interaction">Last Interaction</option>
            <option value="stage">Stage</option>
            <option value="budget">Budget</option>
          </select>
          
          <button
            onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="text-sm text-gray-500">
          {/* This will be filled by parent component with result count */}
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;