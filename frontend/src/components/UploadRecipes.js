import React, { useState, forwardRef } from 'react';
import { Box, Typography, Button, IconButton, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RecipeForm from './RecipeForm';
import api from '../utils/api';

const UploadRecipes = forwardRef(({ onClose, onUploadSuccess }, ref) => {
  const [file, setFile] = useState(null);
  const [parsedRecipes, setParsedRecipes] = useState([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseTextFile = (text) => {
    const recipeBlocks = text.split('---').filter(block => block.trim());
    return recipeBlocks.map(block => {
      const lines = block.trim().split('\n');
      const recipe = {
        title: '',
        description: '',
        ingredients: [],
        steps: '',
        tags: [], // Initialize as empty array, will be set via UI
      };

      let currentSection = '';
      lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.startsWith('Title:')) {
          recipe.title = line.substring('Title:'.length).trim();
        } else if (line.startsWith('Description:')) {
          recipe.description = line.substring('Description:'.length).trim();
        } else if (line.startsWith('Ingredients:')) {
          currentSection = 'ingredients';
        } else if (line.startsWith('Steps:')) {
          recipe.steps = ''; // Will store as a single string initially for RecipeForm
          currentSection = 'steps';
        } else if (line.startsWith('Tags:')) {
          // Tags will be added via UI, so ignore from file parsing
          currentSection = 'tags'; // Still set currentSection to consume potential extra lines
        } else {
          // Append to current section
          if (currentSection === 'ingredients') {
            recipe.ingredients.push(line.replace(/^- /, '')); // Remove leading hyphen for ingredients
          } else if (currentSection === 'steps') {
            recipe.steps += (recipe.steps ? '\n' : '') + line.replace(/^\d+\.? /, ''); // Remove leading numbers
          } else if (currentSection === 'description' && recipe.description) {
            recipe.description += ' ' + line; // Append to description if it spans multiple lines
          } else if (currentSection === 'tags') {
            recipe.tags.push(line.trim()); // Add tags from file
          }
        }
      });

      return recipe;
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/plain') {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsedRecipes = parseTextFile(event.target.result);
          setParsedRecipes(parsedRecipes);
          setCurrentRecipeIndex(0);
          setError(null);
        } catch (err) {
          setError('Error parsing file. Please check the format.');
          setParsedRecipes([]);
        }
      };
      reader.readAsText(selectedFile);
    } else {
      setError('Please select a valid .txt file');
      setFile(null);
      setParsedRecipes([]);
    }
  };

  const handleRecipeUpdate = (updatedRecipe) => {
    console.log('UploadRecipes: Updated Recipe received from RecipeForm:', updatedRecipe);
    const newParsedRecipes = [...parsedRecipes];
    newParsedRecipes[currentRecipeIndex] = updatedRecipe;
    setParsedRecipes(newParsedRecipes);
  };

  const handleNext = () => {
    if (currentRecipeIndex < parsedRecipes.length - 1) {
      setCurrentRecipeIndex(currentRecipeIndex + 1);
    } else {
      // All recipes processed, save them
      handleSaveAll();
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Save all recipes
      for (const recipe of parsedRecipes) {
        console.log('UploadRecipes: Sending recipe to backend:', recipe);
        const formData = new FormData();
        formData.append('title', recipe.title);
        formData.append('description', recipe.description);
        formData.append('ingredients', JSON.stringify(recipe.ingredients));
        formData.append('steps', recipe.steps);
        formData.append('tags', JSON.stringify(recipe.tags));
        // Conditionally add imageUrl only if it exists from RecipeForm processing
        if (recipe.imageUrl) formData.append('imageUrl', recipe.imageUrl);

        await api.post('/recipes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onUploadSuccess && onUploadSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving recipes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box ref={ref} sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2, p: 4, maxHeight: '90vh', overflowY: 'auto', width: '90%', maxWidth: 800 }}>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>

      <Typography variant="h5" fontWeight="bold" mb={3}>
        Upload Recipes
      </Typography>

      {parsedRecipes.length === 0 ? (
        <Box>
          <Typography variant="body1" mb={2}>
            Upload a .txt file containing one or more recipes. Each recipe should be separated by '---'.
          </Typography>
          <Typography variant="body2" mb={2} color="text.secondary">
            Example format:
            <br />
            Title: Recipe Name
            <br />
            Description: Recipe description
            <br />
            Ingredients:
            <br />
            - Ingredient 1
            <br />
            - Ingredient 2
            <br />
            Steps:
            <br />
            1. Step one
            <br />
            2. Step two
            <br />
            ---
          </Typography>
          <Button
            variant="contained"
            component="label"
            fullWidth
          >
            Choose File
            <input
              type="file"
              hidden
              accept=".txt"
              onChange={handleFileChange}
            />
          </Button>
          {file && (
            <Typography variant="body2" mt={1}>
              Selected file: {file.name}
            </Typography>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" mb={2}>
            Recipe {currentRecipeIndex + 1} of {parsedRecipes.length}
          </Typography>
          <RecipeForm
            initialData={parsedRecipes[currentRecipeIndex]}
            onSuccess={handleRecipeUpdate}
            isBatchUpload={true}
          />
          <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              {currentRecipeIndex < parsedRecipes.length - 1 ? 'Next Recipe' : 'Save All Recipes'}
            </Button>
          </Stack>
        </Box>
      )}

      {error && (
        <Typography color="error" mt={2}>{error}</Typography>
      )}
    </Box>
  );
});

export default UploadRecipes;