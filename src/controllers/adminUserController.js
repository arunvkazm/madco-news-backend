import User from "../models/User.js";
import { canCreateRole } from "../utils/rolePermissions.js";

/* -----------------------------------------------
   CREATE SUB_ADMIN OR EDITOR
----------------------------------------------- */
export async function createAdminUser(req, res) {
  try {
    const creator = req.user;
    const {
      name,
      email,
      password,
      role,
      phoneNumber,
      country,
      userStatus,
      allowedCategories
    } = req.body;

    // 🚫 Nobody is allowed to create a super admin
    if (role === "super_admin") {
      return res.status(403).json({
        message: "Super admin accounts cannot be created through this API"
      });
    }

    // RBAC: super_admin → sub_admin/editor | sub_admin → editor only
    if (!canCreateRole(creator.role, role)) {
      return res.status(403).json({
        message: `You cannot create role '${role}'`
      });
    }

    // Email existence check
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already in use" });

    // Create user
    const newUser = await User.create({
      name,
      email,
      password,
      role,
      phoneNumber,
      country,
      userStatus: userStatus || "active",
      createdBy: creator._id,
      allowedCategories: allowedCategories || [],
    });

    res.status(201).json({
      message: "Admin user created",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (err) {
    console.error("Create Admin Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}


/* ------------------------------------------------
   GET ALL ADMIN USERS (super_admin / sub_admin)
------------------------------------------------ */
export async function getAllAdminUsers(req, res) {
  try {
    const filter = {};

    if (req.user.role === "sub_admin") {
      filter.createdBy = req.user._id;
      filter.role = "editor";
    }

    if (req.user.role === "super_admin") {
      filter.role = { $in: ["sub_admin", "editor"] };
    }

    const users = await User.find(filter).select("-password -refreshTokens");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/* -----------------------------------------------
   UPDATE ADMIN USER
----------------------------------------------- */
export async function updateAdminUser(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user.role === "sub_admin") {
      if (user.role !== "editor" || String(user.createdBy) !== String(req.user._id)) {
        return res.status(403).json({ message: "Permission denied" });
      }
      if (updates.role) delete updates.role;
    }

    if (updates.role && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can change roles" });
    }

    Object.assign(user, updates);
    await user.save();

    res.json({ message: "Admin user updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/* -----------------------------------------------
   DELETE (DEACTIVATE) ADMIN USER
----------------------------------------------- */
export async function deleteAdminUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user.role === "sub_admin") {
      if (user.role !== "editor" || String(user.createdBy) !== String(req.user._id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    user.isActive = false;
    user.userStatus = "inactive";
    await user.save();

    res.json({ message: "Admin user deactivated", userId: id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}
