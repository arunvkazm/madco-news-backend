import User from "../models/User.js";

export async function selectCategories(req, res, next) {
  try {
    const { categories } = req.body; // array of category IDs

    if (!categories || !Array.isArray(categories) || categories.length === 0)
      return res.status(400).json({ message: "Categories required", key: "MISSING_CATEGORIES" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found", key: "USER_NOT_FOUND" });

    // ✅ Ensure OTP verified first
    if (!user.isVerified)
      return res.status(403).json({ message: "Verify OTP before selecting categories", key: "VERIFY_OTP_FIRST" });

    user.preferredCategories = categories;
    user.isCategoriesSelected = true;
    await user.save();

    return res.status(200).json({
      message: "Categories saved successfully",
      key: "CATEGORIES_SAVED",
      next: "DASHBOARD"
    });
  } catch (err) {
    next(err);
  }
}
