export const canCreateRole = (creatorRole, targetRole) => {
  const matrix = {
    super_admin: ["sub_admin", "editor"],
    sub_admin: ["editor"],
    editor: [], // cannot create anyone
  };

  return matrix[creatorRole]?.includes(targetRole);
};
