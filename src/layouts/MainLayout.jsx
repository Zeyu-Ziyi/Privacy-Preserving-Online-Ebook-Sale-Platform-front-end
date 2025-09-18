// src/layouts/MainLayout.jsx
import React from 'react';
import { Container } from '@mui/material';
import Header from '../components/Header';

const MainLayout = ({ children }) => {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        {children}
      </Container>
    </>
  );
};

export default MainLayout;