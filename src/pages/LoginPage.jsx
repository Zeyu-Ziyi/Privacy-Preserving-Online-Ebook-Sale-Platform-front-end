// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Link, Alert } from '@mui/material';
import { apiLogin } from '../api/apiService'; // 导入真实 API
import { jwtDecode } from 'jwt-decode'; // 导入解码器

const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // 用于显示登录失败

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // 重置错误
    try {
      // 1. 调用真实 API
      const response = await apiLogin(email, password);
      const { token } = response.data;
      
      // 2. 解码 Token 以获取用户信息 (sub = userId, email)
      const decoded = jwtDecode(token);
      const userData = { id: decoded.sub, email: decoded.email };

      // 3. 使用真实数据更新 Zustand Store
      login(userData, token);

      // 4. 导航到首页
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.error || '登录失败，请检查您的邮箱或密码。');
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
          Sign In
        </Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {/* ... (TextFields 保持不变) ... */}
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
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Box textAlign="center">
            <Link component={RouterLink} to="/signup" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;