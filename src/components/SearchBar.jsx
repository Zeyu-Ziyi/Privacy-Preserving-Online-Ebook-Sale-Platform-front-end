// src/components/SearchBar.jsx
import React, { useState } from 'react'; // 引入 useState
import { Paper, InputBase, IconButton, Select, MenuItem, FormControl } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSearchStore } from '../store/useSearchStore';
import { useNavigate, createSearchParams } from 'react-router-dom';

const SearchBar = () => {
  // Get global state and actions from Zustand
  // We still need searchType and setQuery
  const { searchType, setSearchType, setQuery: setGlobalQuery, query: globalQuery } = useSearchStore();
  const navigate = useNavigate();

  // 1. Use local state to manage the current value of the input box
  //    Use the global query as the initial value, so that the last search word can be retained when refreshing the page or returning
  const [localQuery, setLocalQuery] = useState(globalQuery);

  const handleSearch = (e) => {
    e.preventDefault();
    
    // 3. When submitting, use the local localQuery to update the global state and navigate
    setGlobalQuery(localQuery); 

    navigate({
      pathname: '/search',
      search: `?${createSearchParams({ query: localQuery, type: searchType })}`
    });
  };

  return (
    <form onSubmit={handleSearch} style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
      <Paper sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '100%', maxWidth: 700 }}>
        <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
          <Select
            id="search-type-select"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            disableUnderline
          >
            <MenuItem value="title">Title</MenuItem>
            <MenuItem value="author">Author</MenuItem>
          </Select>
        </FormControl>

        {/* 2. InputBase is now controlled by localQuery */}
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search for books by title or author..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)} // Only update the local state
        />
        
        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
    </form>
  );
};

export default SearchBar;