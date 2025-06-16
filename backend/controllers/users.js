const User = require('../models/User');
const Recipe = require('../models/Recipe');

// Get saved recipes
exports.getSavedRecipes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedRecipes');
    res.status(200).json({ success: true, data: user.savedRecipes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching saved recipes', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const existingUser = await User.findOne({
      $or: [
        { username, _id: { $ne: req.user.id } },
        { email, _id: { $ne: req.user.id } }
      ]
    });
    if (existingUser) return res.status(400).json({ success: false, message: 'Username or email already taken' });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, email },
      { new: true, runValidators: true }
    ).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload an image' });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: req.file.path },
      { new: true }
    ).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading profile image', error: error.message });
  }
};

// Unsave a recipe
exports.unsaveRecipe = async (req, res) => {
  try {
    const { recipeId } = req.body;
    if (!recipeId) return res.status(400).json({ success: false, message: 'Recipe ID is required' });
    const user = await User.findById(req.user.id);
    user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== recipeId);
    await user.save();
    res.status(200).json({ success: true, message: 'Recipe removed from favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing recipe from favorites', error: error.message });
  }
}; 