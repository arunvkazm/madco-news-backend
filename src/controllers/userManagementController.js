import User from "../models/User.js";

/* -----------------------------------------------
   GET ALL NORMAL USERS (role:user)
----------------------------------------------- */
export async function getAllAppUsers(req, res) {
  try {
    const { search } = req.query;
    const filter = { role: "user" };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter).select("-password -refreshTokens");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/* -----------------------------------------------
   UPDATE NORMAL USER
----------------------------------------------- */
export async function updateAppUser(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) return res.status(404).json({ message: "User not found" });

    Object.assign(user, req.body);
    await user.save();

    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/* -----------------------------------------------
   BLOCK / UNBLOCK NORMAL USER
----------------------------------------------- */
export async function toggleAppUserStatus(req, res) {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    user.userStatus = user.isActive ? "active" : "inactive";

    await user.save();

    res.json({ message: "User status updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/* -----------------------------------------------
   DELETE NORMAL USER
----------------------------------------------- */
export async function deleteAppUser(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, role: "user" });

    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted", userId: id });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}
