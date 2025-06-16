import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Stack, InputLabel, OutlinedInput } from '@mui/material';
import Select from 'react-select';
import api from '../utils/api';

const tagOptions = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'dinner', label: 'Dinner' },
  // Add more as needed
];

const defaultForm = {
  title: '',
  description: '',
  ingredients: '',
  steps: '',
  tags: [], // Change to an array for react-select
  image: null,
};

const RecipeForm = ({ onSuccess, initialData, isBatchUpload = false }) => {
  const [form, setForm] = useState(initialData || defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        // Ensure ingredients is a string for the TextField
        ingredients: Array.isArray(initialData.ingredients) ? initialData.ingredients.join('\n') : initialData.ingredients || '',
        // Ensure tags are in the correct format for react-select
        tags: Array.isArray(initialData.tags) ? initialData.tags.map(tag => ({ value: tag, label: tag })) : [],
        // Clear image for batch upload, as it's uploaded separately
        image: null,
      });
    } else {
      setForm(defaultForm);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm({ ...form, image: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleTagChange = (selectedOptions) => {
    setForm({ ...form, tags: selectedOptions || [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isBatchUpload) {
        // Handle image upload if in batch mode
        let imageUrl = form.imageUrl; // Keep existing image URL if present
        if (form.image) {
          const formData = new FormData();
          formData.append('image', form.image);
          const uploadRes = await api.post('/recipes/test-upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          imageUrl = uploadRes.data.data.url; // Get Cloudinary URL
        }

        // Call onSuccess with updated recipe data (including image URL)
        onSuccess && onSuccess({
          ...form,
          ingredients: form.ingredients.split('\n').filter(item => item.trim() !== ''),
          steps: form.steps.split('\n').filter(item => item.trim() !== '').join('\n'),
          tags: form.tags.map(tag => tag.value),
          imageUrl: imageUrl, // Add the image URL
          image: null, // Clear the file object
        });

      } else {
        // Original single recipe create/update logic
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('ingredients', JSON.stringify(form.ingredients.split('\n').filter(item => item.trim() !== '')));
        formData.append('steps', form.steps.split('\n').filter(item => item.trim() !== '').join('\n'));
        formData.append('tags', JSON.stringify(form.tags.map(tag => tag.value)));
        if (form.image) formData.append('image', form.image);

        let res;
        if (form._id) {
          res = await api.put(`/recipes/${form._id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          res = await api.post('/recipes', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        onSuccess && onSuccess(res.data.data);
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Error saving recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        {isBatchUpload ? 'Review Recipe & Add Image' : (form._id ? 'Edit Recipe' : 'Add New Recipe')}
      </Typography>
      <TextField
        label="Title"
        name="title"
        value={form.title}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Ingredients (one per line)"
        name="ingredients"
        value={form.ingredients}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
        multiline
        minRows={3}
      />
      <TextField
        label="Steps (instructions)"
        name="steps"
        value={form.steps}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
        multiline
        minRows={4}
      />
      <InputLabel sx={{ mt: 2 }}>Tags</InputLabel>
      <Select
        isMulti
        options={tagOptions}
        value={form.tags}
        onChange={handleTagChange}
        placeholder="Select tags..."
      />
      <InputLabel sx={{ mt: 2 }}>Image</InputLabel>
      <OutlinedInput
        type="file"
        name="image"
        onChange={handleChange}
        fullWidth
        inputProps={{ accept: 'image/*' }}
      />
      {error && (
        <Typography color="error" mt={2}>{error}</Typography>
      )}
      <Stack direction="row" spacing={2} mt={3}>
        <Button type="submit" variant="contained" color="primary" disabled={loading}>
          {isBatchUpload ? (form.image ? 'Upload Image & Next' : 'Next') : (form._id ? 'Update' : 'Create')}
        </Button>
      </Stack>
    </Box>
  );
};

export default RecipeForm; 