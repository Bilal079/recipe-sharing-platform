import React, { useState, useEffect } from 'react';
import { Card, CardMedia, CardContent, Typography, CardActionArea, IconButton, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import api from '../utils/api';

const RecipeCard = ({ recipe, onRecipeUpdate, user, onUserUpdate }) => {
  const [hover, setHover] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log('RecipeCard useEffect - user:', user);
    console.log('RecipeCard useEffect - recipe._id:', recipe._id);
    if (user && recipe) {
      console.log('RecipeCard useEffect - user.savedRecipes:', user.savedRecipes);
      const saved = user.savedRecipes?.some(savedRecipe => {
        console.log('Comparing savedRecipe._id:', savedRecipe._id, '(' + typeof savedRecipe._id + ')', 'with recipe._id:', recipe._id, '(' + typeof recipe._id + ')');
        const isMatch = savedRecipe._id.toString() === recipe._id.toString();
        console.log('Match result:', isMatch);
        return isMatch;
      });
      setIsSaved(saved);
      console.log('RecipeCard useEffect - isSaved calculated:', saved);
    }
  }, [user, recipe]);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      await api.delete(`/recipes/${recipe._id}`);
      onRecipeUpdate && onRecipeUpdate();
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    console.log('handleSave called. Current isSaved:', isSaved);
    if (!user) return; // Should not happen if button is conditionally rendered
    console.log('setSaving(true) called in handleSave');
    setSaving(true);
    try {
      await api.post(`/recipes/${recipe._id}/save`);
      setIsSaved(true);
      console.log('handleSave success. New isSaved:', true);
      onRecipeUpdate && onRecipeUpdate(); // Refresh parent component data
      onUserUpdate && onUserUpdate(); // Refresh global user data
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.message === 'Recipe already saved') {
        setIsSaved(true); // Already saved, so ensure UI reflects it
        console.log('handleSave error (already saved). New isSaved:', true);
        onUserUpdate && onUserUpdate(); // Ensure user data is refreshed even if already saved
      } else {
        console.error('Error saving recipe:', err);
        console.log('handleSave error. isSaved remains:', isSaved);
      }
    } finally {
      console.log('setSaving(false) called in handleSave finally block');
      setSaving(false);
    }
  };

  const handleUnsave = async (e) => {
    e.preventDefault();
    console.log('handleUnsave called. Current isSaved:', isSaved);
    if (!user) return; // Should not happen if button is conditionally rendered
    console.log('setSaving(true) called in handleUnsave');
    setSaving(true);
    try {
      await api.post(`/users/unsave-recipe`, { recipeId: recipe._id });
      setIsSaved(false);
      console.log('handleUnsave success. New isSaved:', false);
      onRecipeUpdate && onRecipeUpdate(); // Refresh parent component data
      onUserUpdate && onUserUpdate(); // Refresh global user data
    } catch (err) {
      console.error('Error unsaving recipe:', err);
      console.log('handleUnsave error. isSaved remains:', isSaved);
    } finally {
      console.log('setSaving(false) called in handleUnsave finally block');
      setSaving(false);
    }
  };

  const isAuthor = user && recipe.author && (user._id === recipe.author._id || recipe._id === recipe.author);

  return (
    <Card sx={{ maxWidth: 345, m: 2, position: 'relative' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {hover && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1, zIndex: 1 }}>
          {isAuthor && (
            <>
              <IconButton color="primary" component={RouterLink} to={`/recipe/${recipe._id}?edit=true`} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton color="error" onClick={handleDelete} size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      )}
      {user && !isAuthor && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1, zIndex: 1 }}>
          {isSaved ? (
            <IconButton
              color="secondary"
              onClick={handleUnsave}
              disabled={saving}
              size="small"
            >
              <FavoriteIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton
              color="secondary"
              onClick={handleSave}
              disabled={saving}
              size="small"
            >
              <FavoriteBorderIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
      <CardActionArea component={RouterLink} to={`/recipe/${recipe._id}`}>
        <CardMedia
          component="img"
          height="180"
          image={recipe.imageUrl || 'https://via.placeholder.com/300'}
          alt={recipe.title}
        />
        <CardContent>
          <Typography gutterBottom variant="h6" component="div">
            {recipe.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {recipe.description?.slice(0, 80) || ''}...
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default RecipeCard; 