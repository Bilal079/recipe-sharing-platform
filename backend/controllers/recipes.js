const Recipe = require('../models/Recipe');
const User = require('../models/User');

// Get all recipes
exports.getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('author', 'username')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: recipes.length, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching recipes', error: error.message });
  }
};

// Get single recipe
exports.getRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'username')
      .populate('comments.user', 'username');
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    res.status(200).json({ success: true, data: recipe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching recipe', error: error.message });
  }
};

// Create recipe
exports.createRecipe = async (req, res) => {
  try {
    const { title, description, ingredients, steps, tags, imageUrl } = req.body;
    const recipeData = {
      title,
      description,
      ingredients: JSON.parse(ingredients),
      steps,
      tags: JSON.parse(tags),
      author: req.user.id
    };

    if (req.file) {
      recipeData.imageUrl = req.file.path;
    } else if (imageUrl) {
      recipeData.imageUrl = imageUrl;
    }

    const recipe = await Recipe.create(recipeData);
    res.status(201).json({ success: true, data: recipe });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ success: false, message: 'Error creating recipe', error: error.message });
  }
};

// Update recipe
exports.updateRecipe = async (req, res) => {
  try {
    let recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    if (recipe.author.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'Not authorized to update this recipe' });
    const updateData = { ...req.body, ingredients: JSON.parse(req.body.ingredients), tags: JSON.parse(req.body.tags) };
    if (req.file) updateData.imageUrl = req.file.path;
    recipe = await Recipe.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: recipe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating recipe', error: error.message });
  }
};

// Delete recipe
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    if (recipe.author.toString() !== req.user.id) return res.status(401).json({ success: false, message: 'Not authorized to delete this recipe' });
    await Recipe.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ success: false, message: 'Error deleting recipe', error: error.message });
  }
};

// Like recipe
exports.likeRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    recipe.likes += 1;
    await recipe.save();
    res.status(200).json({ success: true, data: recipe });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error liking recipe', error: error.message });
  }
};

// Save recipe
exports.saveRecipe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    if (user.savedRecipes.includes(req.params.id)) return res.status(400).json({ success: false, message: 'Recipe already saved' });
    user.savedRecipes.push(req.params.id);
    await user.save();
    res.status(200).json({ success: true, data: user.savedRecipes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving recipe', error: error.message });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const { text, emojis } = req.body;
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    recipe.comments.push({ user: req.user.id, text, emojis: emojis || [] });
    await recipe.save();
    res.status(200).json({ success: true, data: recipe.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding comment', error: error.message });
  }
};

// Edit comment
exports.editComment = async (req, res) => {
  try {
    const { recipeId, commentId } = req.params;
    const { text, emojis } = req.body;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    const comment = recipe.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
    comment.text = text;
    comment.emojis = emojis || [];
    await recipe.save();
    res.status(200).json({ success: true, data: recipe.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error editing comment', error: error.message });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { recipeId, commentId } = req.params;
    console.log('Backend: req.user.id:', req.user.id, 'Type:', typeof req.user.id);
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ success: false, message: 'Recipe not found' });
    const comment = recipe.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    console.log('Backend: comment.user:', comment.user, 'Type:', typeof comment.user);

    const isCommentAuthor = (
      (typeof comment.user === 'object' && comment.user._id && comment.user._id.toString() === req.user.id) ||
      (typeof comment.user === 'string' && comment.user === req.user.id)
    );

    if (!isCommentAuthor) return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });

    recipe.comments.pull(commentId);
    await recipe.save();
    res.status(200).json({ success: true, data: recipe.comments });
  } catch (error) {
    console.error('Error deleting comment:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Error deleting comment', error: error.message });
  }
};

// Get recipes by user ID
exports.getUserRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ author: req.params.userId })
      .populate('author', 'username')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: recipes.length, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching user recipes', error: error.message });
  }
};

// Search recipes
exports.searchRecipes = async (req, res) => {
  try {
    const { query, tags, limit } = req.query;
    let findQuery = Recipe.find();

    let searchQuery = {};
    if (query) searchQuery.$text = { $search: query };
    if (tags) searchQuery.tags = { $in: tags.split(',') };

    if (Object.keys(searchQuery).length > 0) {
      findQuery = findQuery.find(searchQuery);
    }

    findQuery = findQuery.populate('author', 'username').sort('-createdAt');

    if (limit) {
      findQuery = findQuery.limit(parseInt(limit));
    }

    const recipes = await findQuery.exec();

    res.status(200).json({ success: true, count: recipes.length, data: recipes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching recipes', error: error.message });
  }
};

// Test upload (for Cloudinary)
exports.testUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }
    res.status(200).json({ success: true, message: 'Image uploaded successfully', data: { url: req.file.path, filename: req.file.filename } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading image', error: error.message });
  }
}; 