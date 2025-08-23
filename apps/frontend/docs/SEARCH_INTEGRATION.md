# Frontend Search Integration Documentation

This document outlines the complete search implementation for the Mama Bloemetjes frontend application.

## Overview

The search system provides a comprehensive search experience with:
- **Modal-based search interface** with autocomplete
- **Real-time search suggestions** from the backend
- **Popular search terms** display
- **Seamless integration** with the shop page
- **Mobile-responsive design**

## Architecture

### Components

#### 1. SearchContext (`context/SearchContext.tsx`)
Global state management for search functionality:
- Tracks search query, results, loading state
- Manages search modal open/close state
- Provides search actions throughout the app

#### 2. useSearch Hook (`hooks/useSearch.ts`)
Custom hook for search functionality:
- Debounced search queries (300ms)
- Automatic API calls to backend search endpoint
- Error handling and loading states
- Returns search results and metadata

#### 3. useSearchSuggestions Hook (`hooks/useSearch.ts`)
Provides autocomplete suggestions:
- Fetches suggestions from `/products/search/suggestions`
- Debounced for performance (200ms)
- Fallback to empty array on errors

#### 4. usePopularSearches Hook (`hooks/useSearch.ts`)
Fetches popular search terms:
- Gets data from `/products/search/popular`
- Used when no search query is entered
- Configurable limit (default: 5)

### UI Components

#### 1. SearchModal (`components/Search/SearchModal.tsx`)
Main search interface:
- **Features:**
  - Full-screen modal overlay
  - Real-time search with instant results
  - Keyboard navigation (Arrow keys, Enter, Tab, Esc)
  - Autocomplete suggestions
  - Popular searches when idle
  - Product result previews
  - "View all results" navigation to shop page

#### 2. SearchButton (`components/Search/SearchButton.tsx`)
Trigger button for opening search modal:
- **Variants:**
  - `default` - With background and text
  - `mobile` - Mobile-optimized styling
  - `minimal` - Icon-only version
- **Configurable text display**

## Backend Integration

### API Endpoints Used

#### Primary Search
```
GET /products/search?q={query}&page={page}&per_page={limit}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "products": [...],
    "total_count": 25,
    "page": 1,
    "per_page": 20,
    "total_pages": 2,
    "search_time_ms": 45,
    "suggestions": ["suggestion1", "suggestion2"]
  }
}
```

#### Search Suggestions
```
GET /products/search/suggestions?q={query}
```
**Response:**
```json
{
  "status": "success",
  "data": ["suggestion1", "suggestion2", "suggestion3"]
}
```

#### Popular Searches
```
GET /products/search/popular?per_page={limit}
```
**Response:**
```json
{
  "status": "success",
  "data": ["popular term 1", "popular term 2"]
}
```

## Usage Examples

### Basic Integration

```tsx
import { useSearchContext } from '../context/SearchContext';
import { SearchButton, SearchModal } from '../components/Search';

function MyComponent() {
  const { isSearchOpen, openSearch, closeSearch } = useSearchContext();
  
  return (
    <>
      <SearchButton variant="default" />
      <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
}
```

### Using Search Hooks

```tsx
import { useSearch, useSearchSuggestions } from '../hooks/useSearch';

function CustomSearchComponent() {
  const { results, isLoading, error, setSearchQuery } = useSearch({
    minSearchLength: 2,
    debounceDelay: 300
  });
  
  const suggestions = useSearchSuggestions(currentQuery);
  
  // Component implementation...
}
```

### Navigation Integration

The search system is integrated into the main navigation:

```tsx
// In Navigation.tsx
import { SearchButton, SearchModal } from './Search';

// Search trigger button
<SearchButton
  variant='minimal'
  showText={false}
  className='text-[#7d6b55] hover:text-[#d4a574]'
/>

// Search modal
<SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
```

## Features

### 1. Real-time Search
- **Debounced input** (300ms) prevents excessive API calls
- **Automatic search** when query length >= 2 characters
- **Loading indicators** provide user feedback
- **Error handling** with graceful fallbacks

### 2. Autocomplete & Suggestions
- **Dynamic suggestions** based on current input
- **Popular searches** shown when input is empty
- **Keyboard navigation** with arrow keys
- **Click or Enter to select** suggestions

### 3. Search Results Display
- **Product previews** in modal (up to 6 products)
- **Result count** and search time display
- **"View all results"** button navigates to shop page
- **Direct product navigation** on click

### 4. Mobile Experience
- **Full-screen modal** on mobile devices
- **Touch-friendly interface**
- **Mobile-optimized search button**
- **Responsive grid layout** for results

### 5. Keyboard Shortcuts
- **Cmd/Ctrl + K** - Open search modal (planned)
- **Escape** - Close modal
- **Arrow Keys** - Navigate suggestions
- **Enter** - Select suggestion or search
- **Tab** - Autocomplete current suggestion

## Shop Page Integration

The search system seamlessly integrates with the shop page:

### URL Parameters
- Search terms are passed via `?search=query` parameter
- Shop page automatically loads search results
- Preserves search state when navigating back

### State Synchronization
- SearchContext maintains search state across navigation
- Shop page can access global search results
- Filters and sorting work with search results

## Performance Optimizations

### 1. Debouncing
- **Search queries:** 300ms debounce
- **Suggestions:** 200ms debounce
- Prevents excessive API calls

### 2. Caching
- Results cached in component state
- Suggestions cached per query
- Popular searches cached on load

### 3. Lazy Loading
- Search modal loads on demand
- Results paginated on backend
- Images loaded progressively

## Error Handling

### 1. Network Errors
- Graceful fallback to empty results
- Error messages logged to console
- User sees loading state until timeout

### 2. API Errors
- Invalid responses handled gracefully
- Fallback to empty arrays for suggestions
- Search continues to work with cached data

### 3. User Experience
- Loading states prevent user confusion
- Empty states provide helpful guidance
- Popular searches offer alternatives

## Accessibility

### 1. Keyboard Navigation
- Full keyboard support
- Focus management in modal
- Screen reader compatible

### 2. ARIA Labels
- Descriptive button labels
- Modal accessibility attributes
- Search results properly announced

### 3. Visual Indicators
- High contrast colors
- Clear focus states
- Loading animations

## Configuration

### Environment Variables
```env
# API Base URL (already configured in lib/axios.ts)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Customization Options

#### Search Behavior
```tsx
const searchOptions = {
  searchFields: ['name', 'description', 'colors'],
  minSearchLength: 2,
  debounceDelay: 300,
};
```

#### UI Customization
```tsx
<SearchButton
  variant="default" | "mobile" | "minimal"
  className="custom-classes"
  showText={true}
/>
```

## Testing

### Manual Testing Checklist
- [ ] Search modal opens and closes correctly
- [ ] Search queries return relevant results
- [ ] Suggestions appear and are clickable
- [ ] Keyboard navigation works
- [ ] Mobile experience is responsive
- [ ] Shop page integration works
- [ ] Popular searches display when idle
- [ ] Error states handle gracefully

### Test Scenarios
1. **Empty Search:** Shows popular searches
2. **Short Query:** No API calls until 2+ characters
3. **Valid Search:** Returns products and metadata
4. **No Results:** Shows helpful empty state
5. **Network Error:** Graceful fallback behavior

## Future Enhancements

### Planned Features
1. **Search Filters in Modal**
   - Price range sliders
   - Category selection
   - Color filters

2. **Advanced Search**
   - Boolean operators
   - Exact phrase matching
   - Negative keywords

3. **Search Analytics**
   - Track popular queries
   - User behavior insights
   - A/B testing capabilities

4. **Voice Search**
   - Speech-to-text integration
   - Browser speech API
   - Mobile voice input

5. **Search History**
   - Personal search history
   - Recent searches
   - Saved searches

### Technical Improvements
1. **Performance**
   - Result caching with Redis
   - CDN for search suggestions
   - Elasticsearch integration

2. **SEO**
   - Server-side search rendering
   - Search result pages
   - Sitemap generation

3. **Internationalization**
   - Multi-language search
   - Localized suggestions
   - Regional popular searches

## Troubleshooting

### Common Issues

#### 1. Search Modal Not Opening
- Check SearchContext provider wraps app
- Verify openSearch function is called
- Check for JavaScript errors in console

#### 2. No Search Results
- Verify backend is running on port 3001
- Check network tab for API calls
- Confirm API endpoints are accessible

#### 3. Suggestions Not Loading
- Check suggestions endpoint response
- Verify debounce timing
- Look for console errors

#### 4. Mobile Issues
- Test responsive breakpoints
- Verify touch interactions
- Check modal overlay on mobile

### Debug Commands
```bash
# Check backend API
curl "http://localhost:3001/products/search?q=test"

# Check suggestions endpoint
curl "http://localhost:3001/products/search/suggestions?q=ro"

# Check popular searches
curl "http://localhost:3001/products/search/popular"
```

## Conclusion

The search implementation provides a modern, efficient, and user-friendly search experience that integrates seamlessly with both the backend API and existing frontend components. The modular architecture allows for easy customization and future enhancements while maintaining excellent performance and accessibility standards.

For technical questions or contributions, refer to the main project documentation or contact the development team.