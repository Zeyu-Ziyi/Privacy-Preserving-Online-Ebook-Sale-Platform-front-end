// src/components/SearchBar.jsx
import React, { useState } from 'react'; // 引入 useState
import { Paper, InputBase, IconButton, Select, MenuItem, FormControl } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSearchStore } from '../store/useSearchStore';
import { useNavigate, createSearchParams } from 'react-router-dom';

const SearchBar = () => {
  // 从Zustand获取全局状态和actions
  // 我们仍然需要searchType和setQuery
  const { searchType, setSearchType, setQuery: setGlobalQuery, query: globalQuery } = useSearchStore();
  const navigate = useNavigate();

  // 1. 使用本地state来管理输入框的当前值
  //    用全局的query来作为初始值，这样刷新页面或返回时能保留上次的搜索词
  const [localQuery, setLocalQuery] = useState(globalQuery);

  const handleSearch = (e) => {
    e.preventDefault();
    
    // 3. 在提交时，用本地的localQuery来更新全局状态并导航
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

        {/* 2. InputBase现在由localQuery控制 */}
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search for books by title or author..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)} // 只更新本地state
        />
        
        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
          <SearchIcon />
        </IconButton>
      </Paper>
    </form>
  );
};

export default SearchBar;