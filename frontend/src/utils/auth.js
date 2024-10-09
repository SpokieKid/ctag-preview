export const getCurrentUserId = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.id : null;
};