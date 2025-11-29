import User from "../models/User.js";
import Category from "../models/Category.js";
import Milestone from  "../models/Milestone.js";

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
    console.log("📌 [getMyProfile] Request by User:", req.user?.id);

    const user = await User.findById(req.user.id)
      .select("-password -refreshTokens")
      .populate("preferredCategories", "name")
      .populate(
        "stats.currentMilestone",
        "name description targetSeconds order reward"
      );

    console.log("🔍 [getMyProfile] User found:", user ? "YES" : "NO");

    if (!user) {
      console.log("❌ [getMyProfile] User not found in DB");
      return res.status(404).json({ message: "User not found" });
    }

    console.log(
      "🧭 [getMyProfile] Current milestone:",
      user.stats.currentMilestone
        ? `Order ${user.stats.currentMilestone.order}`
        : "None"
    );

    const currentMilestone = user.stats.currentMilestone;

    let nextMilestone = null;

    if (currentMilestone) {
      console.log(
        `➡️  [getMyProfile] Fetching next milestone: order ${
          currentMilestone.order + 1
        }`
      );

      nextMilestone = await Milestone.findOne({
        order: currentMilestone.order + 1,
      }).select("name description targetSeconds order reward");

      console.log(
        "📦 [getMyProfile] Next milestone found:",
        nextMilestone ? "YES" : "NO"
      );
    } else {
      console.log("🆕 [getMyProfile] No milestone assigned → fetching first one");

      nextMilestone = await Milestone.findOne({ order: 1 }).select(
        "name description targetSeconds order reward"
      );

      console.log(
        "📦 [getMyProfile] First milestone found:",
        nextMilestone ? "YES" : "NO"
      );
    }

    const responsePayload = {
      message: "User info fetched successfully",
      user: {
        ...user.toObject(),
        stats: {
          ...user.stats.toObject(),
          currentMilestone,
          nextMilestone,
        },
      },
    };

    console.log("✅ [getMyProfile] Sending response");
    return res.json(responsePayload);

  } catch (err) {
    console.error("🔥 [getMyProfile] Server error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}



export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;

    if (!name)
      return res.status(400).json({
        message: "Name required",
        key: "NAME_REQUIRED"
      });

    const user = await User.findById(req.user.id);

    if (!user)
      return res.status(404).json({
        message: "User not found",
        key: "USER_NOT_FOUND"
      });

    // ✅ Update allowed fields
    user.name = name || user.name;
    
    // ❗ Only allow email change if needed — or skip this for now
    if (email && email !== user.email) {
      return res.status(400).json({
        message: "Email update not allowed from here",
        key: "EMAIL_UPDATE_NOT_ALLOWED"
      });
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      key: "PROFILE_UPDATED",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        selectedCategories: user.selectedCategories
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}



