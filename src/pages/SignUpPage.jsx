// src/pages/SignUpPage.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Link, Alert } from '@mui/material';
import { apiRegister, apiLogin } from '../api/apiService'; 
import { jwtDecode } from 'jwt-decode'; 

const SignUpPage = () => {
  const { login } = useAuthStore(); 
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error

    try {
      // 1. Call the register API
      await apiRegister(email, password);

      // 2. Call the login API to get Token after successful registration
      const loginResponse = await apiLogin(email, password);
      const { token } = loginResponse.data;

      // 3. Decode Token and update global state
      const decoded = jwtDecode(token);
      const userData = { id: decoded.sub, email: decoded.email };
      
      login(userData, token); 
      
      // 4. Navigate to homepage
      navigate('/');

    } catch (err) {
      console.error('Registration or Login failed:', err);
      // Get error message from backend 
      setError(err.response?.data?.error || 'Registration failed, please try again.');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password (min. 8 characters)" 
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
           <Box textAlign="center">
            <Link component={RouterLink} to="/login" variant="body2">
              {"Already have an account? Sign In"}
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default SignUpPage;