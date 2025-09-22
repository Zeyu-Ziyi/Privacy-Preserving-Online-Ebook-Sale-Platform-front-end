// src/components/Header.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuthStore } from '../store/useAuthStore';
// 引入 useNavigate 和 useLocation hooks
import { useNavigate, useLocation } from 'react-router-dom'; 

const Header = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation(); // 获取当前位置信息

  const handleSignIn = () => {
    navigate('/login');
  };

  const goToIndex = () => {
    navigate('/');
  };


  const handleLogout = () => {
    logout();
    navigate('/'); 
  };

  // 决定是否显示登录按钮
  // 当用户未登录，并且当前路径不是/login或/signup时，才显示
  const showSignInButton = !isAuthenticated && 
                           location.pathname !== '/login' && 
                           location.pathname !== '/signup';

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <LibraryBooksIcon sx={{ mr: 1.5 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }} onClick={goToIndex}>
          Z-Library Clone
        </Typography>

        {isAuthenticated ? (
          // 已登录视图
          <Box>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          // 未登录视图
          // 使用我们上面定义的条件来决定是否渲染按钮
          showSignInButton && (
            <Box>
              <Button color="inherit" onClick={handleSignIn}>
                Sign In
              </Button>
            </Box>
          )
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;