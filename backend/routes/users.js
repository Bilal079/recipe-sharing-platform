const express = require('express');
const router = express.Router();
const {
  getSavedRecipes,
  updateProfile,
  uploadProfileImage,
  unsaveRecipe
} = require('../controllers/users');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/saved-recipes', protect, getSavedRecipes);
router.put('/profile', protect, updateProfile);
router.put('/profile-image', protect, upload.single('image'), uploadProfileImage);
router.post('/unsave-recipe', protect, unsaveRecipe);

module.exports = router; 