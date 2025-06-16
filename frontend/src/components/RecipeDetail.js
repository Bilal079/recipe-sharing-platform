import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, Grid, CircularProgress, IconButton, Modal, Button, TextField, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import api from '../utils/api';
import RecipeForm from './RecipeForm';
import EmojiPicker from 'emoji-picker-react';

const RecipeDetail = ({ user, onUserUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentEmojis, setCommentEmojis] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentEmojis, setEditCommentEmojis] = useState([]);
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [editCommentLoading, setEditCommentLoading] = useState(false);

  const fetchRecipe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recipes/${id}`);
      setRecipe(res.data.data);
    } catch (err) {
      setError('Recipe not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipe();
    if (location.search.includes('edit=true')) setEditOpen(true);
    console.log('RecipeDetail - user:', user);
  }, [id, location.search, user, fetchRecipe]);

  useEffect(() => {
    if (user && recipe) {
      const savedRecipeIds = user.savedRecipes?.map(savedRecipe => savedRecipe._id) || [];
      setIsSaved(savedRecipeIds.includes(recipe._id));
    }
    if (recipe && recipe.comments) {
      setComments(recipe.comments);
    }
  }, [user, recipe]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      await api.delete(`/recipes/${id}`);
      navigate('/');
    }
  };

  const handleEdit = () => {
    if (!user) {
      navigate('/login');
    } else {
      setEditOpen(true);
    }
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
    fetchRecipe();
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/recipes/${id}/save`);
      setIsSaved(true);
      if (onUserUpdate) onUserUpdate();
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.message === 'Recipe already saved') {
        setIsSaved(true);
        console.log('Recipe already saved, updating state.');
      } else {
        console.error('Error saving recipe:', err);
        // Handle other errors, e.g., display a message to the user
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUnsave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/users/unsave-recipe`, { recipeId: id });
      setIsSaved(false);
      if (onUserUpdate) onUserUpdate();
    } catch (err) {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  // Comments logic
  const handleAddEmoji = (emojiData) => {
    setCommentEmojis([...commentEmojis, emojiData.emoji]);
    setShowEmojiPicker(false);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!commentText.trim() && commentEmojis.length === 0) return;
    setCommentLoading(true);
    try {
      const res = await api.post(`/recipes/${id}/comments`, {
        text: commentText,
        emojis: commentEmojis
      });
      setComments(res.data.data);
      setCommentText('');
      setCommentEmojis([]);
    } catch (err) {
      console.error('Error submitting comment:', err);
      // handle error
    } finally {
      setCommentLoading(false);
    }
  };

  // Edit comment logic
  const handleEditComment = (comment) => {
    setEditCommentId(comment._id);
    setEditCommentText(comment.text);
    setEditCommentEmojis(comment.emojis || []);
    setShowEditEmojiPicker(false);
  };

  const handleEditCommentEmoji = (emojiData) => {
    setEditCommentEmojis([...editCommentEmojis, emojiData.emoji]);
    setShowEditEmojiPicker(false);
  };

  const handleEditCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setEditCommentLoading(true);
    try {
      const res = await api.put(`/recipes/${id}/comments/${editCommentId}`, {
        text: editCommentText,
        emojis: editCommentEmojis
      });
      setComments(res.data.data);
      setEditCommentId(null);
      setEditCommentText('');
      setEditCommentEmojis([]);
    } catch (err) {
      // handle error
    } finally {
      setEditCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await api.delete(`/recipes/${id}/comments/${commentId}`);
      setComments(res.data.data);
    } catch (err) {
      // handle error
    }
  };

  const isAuthor = user && recipe && recipe.author && (user._id === recipe.author._id || user._id === recipe.author);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !recipe) {
    return (
      <Box sx={{ textAlign: 'center', my: 8 }}>
        <Typography variant="h5" color="error">{error || 'Recipe not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
      <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
        {isAuthor && (
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
            <IconButton color="primary" onClick={handleEdit}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" onClick={handleDelete}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate('/recipes')} aria-label="back to recipes" sx={{ mr: 1 }}>
            <NavigateBeforeIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 0 }}>
            {recipe.title}
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <img src={recipe.imageUrl || 'https://via.placeholder.com/300'} alt={recipe.title} style={{ width: '100%', borderRadius: 8 }} />
          </Grid>
          <Grid item xs={12} md={7}>
            {user && !isAuthor && (
              isSaved ? (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<FavoriteIcon />}
                  onClick={handleUnsave}
                  disabled={saving}
                  sx={{ mb: 2 }}
                >
                  Remove from Favorites
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<FavoriteBorderIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ mb: 2 }}
                >
                  Save to Favorites
                </Button>
              )
            )}
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" fontWeight="bold">Ingredients:</Typography>
        <List>
          {recipe.ingredients && recipe.ingredients.map((item, idx) => (
            <ListItem key={idx} sx={{ py: 0 }}>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
        <Typography variant="h6" fontWeight="bold" sx={{ mt: 2 }}>Instructions:</Typography>
        <List>
          {recipe.steps && recipe.steps.split('\n').map((step, idx) => (
            <ListItem key={idx} sx={{ py: 0 }}>
              <ListItemText primary={`${idx + 1}. ${step}`} />
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" fontWeight="bold" mb={1}>Comments</Typography>
        <List>
          {comments && comments.length > 0 ? comments.map((comment, idx) => {
            console.log("User prop in RecipeDetail:", user);
            console.log("Comment user in RecipeDetail:", comment.user);
            if (typeof comment.user === 'string') {
              console.log("Comment user (string):", comment.user, "Type:", typeof comment.user);
              console.log("User ID:", user._id, "Type:", typeof user._id);
              console.log("Direct string comparison result:", comment.user === user._id);
            }
            const isCommentAuthor = user && (
              (typeof comment.user === 'object' && comment.user._id === user._id) ||
              (typeof comment.user === 'string' && comment.user === user._id)
            );
            console.log("Are IDs equal?", isCommentAuthor);
            return (
              <ListItem key={idx} alignItems="flex-start" secondaryAction={
                isCommentAuthor && (
                  <>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEditComment(comment)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteComment(comment._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </>
                )
              }>
                <ListItemText
                  primary={comment.text}
                  secondary={comment.emojis && comment.emojis.length > 0 ? comment.emojis.join(' ') : null}
                />
              </ListItem>
            );
          }) : (
            <Typography color="text.secondary" sx={{ px: 2 }}>No comments yet.</Typography>
          )}
        </List>
        <Box component="form" onSubmit={handleCommentSubmit} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Add a comment"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              disabled={commentLoading}
            />
            <Button type="button" onClick={() => setShowEmojiPicker(val => !val)}>
              😊
            </Button>
            <Button type="button" onClick={handleCommentSubmit} variant="contained" disabled={commentLoading}>
              Post
            </Button>
          </Stack>
          {showEmojiPicker && (
            <Box sx={{ position: 'absolute', zIndex: 10 }}>
              <EmojiPicker onEmojiClick={handleAddEmoji} height={350} width={300} />
            </Box>
          )}
          {commentEmojis.length > 0 && (
            <Box sx={{ mt: 1, ml: 1 }}>
              {commentEmojis.map((emoji, idx) => (
                <span key={idx} style={{ fontSize: 22, marginRight: 4 }}>{emoji}</span>
              ))}
            </Box>
          )}
        </Box>
        {/* Edit comment modal */}
        <Modal open={!!editCommentId} onClose={() => setEditCommentId(null)}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2, p: 2, minWidth: 320 }}>
            <form onSubmit={handleEditCommentSubmit}>
              <Typography variant="h6" mb={2}>Edit Comment</Typography>
              <TextField
                label="Edit comment"
                value={editCommentText}
                onChange={e => setEditCommentText(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                disabled={editCommentLoading}
              />
              <Stack direction="row" spacing={1} alignItems="center" mt={2}>
                <Button type="button" onClick={() => setShowEditEmojiPicker(val => !val)}>
                  😊
                </Button>
                <Button type="submit" variant="contained" disabled={editCommentLoading}>
                  Save
                </Button>
              </Stack>
              {showEditEmojiPicker && (
                <Box sx={{ position: 'absolute', zIndex: 10 }}>
                  <EmojiPicker onEmojiClick={handleEditCommentEmoji} height={350} width={300} />
                </Box>
              )}
              {editCommentEmojis.length > 0 && (
                <Box sx={{ mt: 1, ml: 1 }}>
                  {editCommentEmojis.map((emoji, idx) => (
                    <span key={idx} style={{ fontSize: 22, marginRight: 4 }}>{emoji}</span>
                  ))}
                </Box>
              )}
            </form>
          </Box>
        </Modal>
      </Paper>
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2, p: 4, maxHeight: '90vh', overflowY: 'auto' }}>
          <IconButton
            aria-label="close"
            onClick={() => setEditOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <RecipeForm onSuccess={handleEditSuccess} initialData={recipe} />
        </Box>
      </Modal>
    </Box>
  );
};

export default RecipeDetail; 