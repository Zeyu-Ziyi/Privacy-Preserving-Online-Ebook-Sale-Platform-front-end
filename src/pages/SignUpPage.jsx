// src/pages/SignUpPage.jsx
import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Link, Alert } from '@mui/material';
import { apiRegister, apiLogin } from '../api/apiService'; // 导入真实 API
import { jwtDecode } from 'jwt-decode'; // 导入解码器

const SignUpPage = () => {
  const { login } = useAuthStore(); // 注册后直接登录 (来自我们更新后的 store)
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // 用于显示错误
  // 移除了 name 状态，因为后端不需要

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // 重置错误

    try {
      // 步骤 1: 调用注册 API
      await apiRegister(email, password);

      // 步骤 2: 注册成功后，立即调用登录 API 以获取 Token
      const loginResponse = await apiLogin(email, password);
      const { token } = loginResponse.data;

      // 步骤 3: 解码 Token 并更新全局状态
      const decoded = jwtDecode(token);
      const userData = { id: decoded.sub, email: decoded.email };
      
      login(userData, token); 
      
      // 步骤 4: 跳转到首页
      navigate('/');

    } catch (err) {
      console.error('Registration or Login failed:', err);
      // 从后端获取错误消息 (例如 "此邮箱已存在")
      setError(err.response?.data?.error || '注册失败，请重试。');
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
          {/* 移除了 "Full Name" 字段 */}
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
            label="Password (min. 8 characters)" // 提示用户密码长度要求
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