# Privacy-Preserving Online Ebook Sale Platform Front-end

A React-based frontend for an online ebook sale platform with privacy-preserving features.

## Features

### Search and Pagination
- **Empty Search Support**: When search query is empty, the system returns all available books
- **Pagination**: Books are loaded in batches of 5 to prevent overwhelming results
- **Infinite Scroll**: As users scroll down, more books are automatically loaded in real-time
- **Search Types**: Support for searching by title or author
- **Manual Search**: Search results are only returned when users click the search button (not real-time)

### User Interface
- Modern Material-UI based interface
- Responsive design for different screen sizes
- Loading states and error handling
- Book cards with cover images and details
- Individual book detail pages

### Authentication
- User login and signup functionality
- Purchase tracking
- Shopping cart features

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the local development URL (usually http://localhost:5173)

## Search Functionality

### How to Use Search
1. **Empty Search**: Leave the search box empty and click "Show All Books" to view all available books
2. **Title Search**: Select "Title" from the dropdown and enter a book title
3. **Author Search**: Select "Author" from the dropdown and enter an author name
4. **Manual Search**: Click the search button or press Enter to perform the search

### Pagination Behavior
- Initial load shows 5 books
- Scroll down to automatically load the next 5 books
- Loading indicator appears while fetching more books
- "End of results" message appears when all books are loaded

## Project Structure

```
src/
├── api/
│   └── booksApi.js          # API functions for book data
├── components/
│   ├── BookCard.jsx         # Individual book card component
│   ├── Header.jsx           # Navigation header
│   ├── SearchBar.jsx        # Search interface
│   └── SearchResultItem.jsx # Search result item component
├── layouts/
│   └── MainLayout.jsx       # Main layout wrapper
├── pages/
│   ├── BookPage.jsx         # Individual book detail page
│   ├── HomePage.jsx         # Home page with search
│   ├── LoginPage.jsx        # User login page
│   ├── SearchResultsPage.jsx # Search results with infinite scroll
│   └── SignUpPage.jsx       # User registration page
└── store/
    ├── useAuthStore.js      # Authentication state management
    └── useSearchStore.js    # Search state management
```

## Technologies Used

- React 19
- Vite
- Material-UI (MUI)
- TanStack Query (React Query)
- React Router DOM
- Zustand (State Management)
- React Intersection Observer (Infinite Scroll)

## Development

- **Linting**: `npm run lint`
- **Build**: `npm run build`
- **Preview**: `npm run preview`
