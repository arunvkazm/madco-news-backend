import User from "../models/User.js";
import Category from "../models/Category.js";

export async function selectCategories(req, res, next) {
  try {
    const { categories } = req.body; // array of category IDs

    if (!categories || !Array.isArray(categories) || categories.length === 0)
      return res.status(400).json({
        message: "Categories required",
        key: "MISSING_CATEGORIES"
      });

    // ✅ Validate all category IDs exist in DB
    const existingCategories = await Category.find({ _id: { $in: categories } });
    if (existingCategories.length !== categories.length)
      return res.status(400).json({
        message: "Invalid category IDs provided",
        key: "INVALID_CATEGORY_IDS"
      });

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({
        message: "User not found",
        key: "USER_NOT_FOUND"
      });

    // ✅ Ensure user verified before selecting categories
    if (!user.isVerified)
      return res.status(403).json({
        message: "Verify OTP before selecting categories",
        key: "VERIFY_OTP_FIRST"
      });

    // ✅ Save/Update categories
    user.preferredCategories = categories;
    user.isCategoriesSelected = true;
    await user.save();

    return res.status(200).json({
      message: user.isCategoriesSelected
        ? "Categories updated successfully"
        : "Categories saved successfully",
      key: "CATEGORIES_SAVED",
      next: "DASHBOARD"
    });

  } catch (err) {
    next(err);
  }
}


export async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -refreshTokens")
      .populate("preferredCategories", "name");

    return res.json({
      message: "User info fetched successfully",
      user
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}


