// src/components/Header.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { useAuthStore } from '../store/useAuthStore';
// Import useNavigate and useLocation hooks
import { useNavigate, useLocation } from 'react-router-dom'; 

const Header = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation(); // Get current location information

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

  // Decide whether to show the login button
  // Only show when the user is not logged in and the current path is not /login or /signup
  const showSignInButton = !isAuthenticated && 
                           location.pathname !== '/login' && 
                           location.pathname !== '/signup';

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <LibraryBooksIcon sx={{ mr: 1.5 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }} onClick={goToIndex}>
          Privacy-Preserving Online Ebook Sale Platform
        </Typography>

        {isAuthenticated ? (
          // Logged in view
          <Box>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          // Not logged in view
          // Use the conditions we defined above to decide whether to render the button
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