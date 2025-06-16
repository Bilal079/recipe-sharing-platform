import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    navigate('/recipes');
  };

  return (
    <Box sx={{
      background: '#fff',
      py: 8,
      textAlign: 'center',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Container maxWidth="md">
        <Typography variant="h2" fontWeight="bold" gutterBottom>
          All-in-one recipe manager & planner app
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          The ultimate recipe organiser for easy access to all of your recipes on all of your devices
        </Typography>
        <Button variant="contained" color="primary" size="large" sx={{ mt: 4, borderRadius: 8 }} onClick={handleGetStartedClick}>
          Get Started
        </Button>
      </Container>
    </Box>
  );
};

export default HeroSection; 