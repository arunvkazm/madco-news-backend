import User from '../models/User.js';
import Category from '../models/Category.js';

// Get all users (paginated)
export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find({ role: 'user' }).select('-password -refreshTokens');
    return res.json({ message: 'Users fetched successfully', users });
  } catch (err) {
    next(err);
  }
}

// Block / Unblock user
export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = !user.isVerified; // Example: block by marking unverified
    await user.save();

    return res.json({
      message: `User ${user.isVerified ? 'unblocked' : 'blocked'} successfully`,
      user: { id: user._id, email: user.email, isVerified: user.isVerified },
    });
  } catch (err) {
    next(err);
  }
}

// Delete user (optional)
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ message: 'User deleted successfully', userId: id });
  } catch (err) {
    next(err);
  }
}

/**
 * Add a new category
 */
export async function addCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(409).json({ message: 'Category already exists' });

    const category = new Category({ name, description });
    await category.save();

    return res.status(201).json({ message: 'Category created successfully', category });
  } catch (err) {
    next(err);
  }
}

/**
 * Get all categories
 */
export async function getAllCategories(req, res, next) {
  try {
    const categories = await Category.find();
    return res.json({ message: 'Categories fetched successfully', categories });
  } catch (err) {
    next(err);
  }
}

/**
 * Update category
 */
export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name) category.name = name;
    if (description) category.description = description;

    await category.save();
    return res.json({ message: 'Category updated successfully', category });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete category
 */
export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    return res.json({ message: 'Category deleted successfully', categoryId: id });
  } catch (err) {
    next(err);
  }
}