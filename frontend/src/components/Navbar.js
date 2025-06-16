import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);

  const open = Boolean(anchorEl);
  const mobileMenuOpen = Boolean(mobileMenuAnchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuClick = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLogoutClick = () => {
    onLogout();
    handleClose();
    handleMobileMenuClose();
  };

  const handleMenuItemClick = () => {
    handleMobileMenuClose();
  };

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar>
        <Typography
          variant="h5"
          sx={{ flexGrow: 1, fontWeight: 'bold', fontFamily: 'cursive', textDecoration: 'none' }}
          component={RouterLink}
          to="/"
          color="inherit"
        >
          CookBook
        </Typography>

        {/* Desktop Navigation Links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/recipes">Recipes</Button>
          {user && <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>}
        </Box>

        {/* User / Login/Register Buttons for Desktop */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {user ? (
            <>
              <Button
                id="fade-button"
                aria-controls={open ? 'fade-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                color="inherit"
                sx={{ textTransform: 'none', mx: 2, fontSize: '1rem' }}
              >
                {user.username}
              </Button>
              <Menu
                id="fade-menu"
                MenuListProps={{
                  'aria-labelledby': 'fade-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
              >
                <MenuItem onClick={handleLogoutClick}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="primary" variant="contained" sx={{ ml: 2, borderRadius: 8 }} component={RouterLink} to="/register">Register</Button>
            </>
          )}
        </Box>

        {/* Mobile Menu Icon */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenuClick}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={mobileMenuAnchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={mobileMenuOpen}
            onClose={handleMobileMenuClose}
          >
            <MenuItem onClick={handleMenuItemClick} component={RouterLink} to="/">Home</MenuItem>
            <MenuItem onClick={handleMenuItemClick} component={RouterLink} to="/recipes">Recipes</MenuItem>
            {user && (
              <MenuItem onClick={handleMenuItemClick} component={RouterLink} to="/dashboard">Dashboard</MenuItem>
            )}
            {user ? (
              <MenuItem onClick={handleLogoutClick}>Logout ({user.username})</MenuItem>
            ) : (
              [
                <MenuItem key="login" onClick={handleMenuItemClick} component={RouterLink} to="/login">Login</MenuItem>,
                <MenuItem key="register" onClick={handleMenuItemClick} component={RouterLink} to="/register">Register</MenuItem>
              ]
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 