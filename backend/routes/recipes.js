const express = require('express');
const router = express.Router();
const {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  likeRecipe,
  saveRecipe,
  addComment,
  searchRecipes,
  testUpload,
  editComment,
  deleteComment,
  getUserRecipes
} = require('../controllers/recipes');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Test route for Cloudinary
router.post('/test-upload', upload.single('image'), testUpload);

// Public routes
router.get('/', getRecipes);
router.get('/search', searchRecipes);
router.get('/user/:userId', getUserRecipes);
router.get('/:id', getRecipe);

// Protected routes
router.post('/', protect, upload.single('image'), createRecipe);
router.put('/:id', protect, upload.single('image'), updateRecipe);
router.delete('/:id', protect, deleteRecipe);
router.post('/:id/like', protect, likeRecipe);
router.post('/:id/save', protect, saveRecipe);
router.post('/:id/comments', protect, addComment);
router.put('/:recipeId/comments/:commentId', protect, editComment);
router.delete('/:recipeId/comments/:commentId', protect, deleteComment);

module.exports = router; 