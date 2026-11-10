const SESSION_KEY = "widya_netra_session";

export const saveSession = (user) => {
  const session = {
    ...user,
    name: user.name || user.nama_lengkap || user.username || user.email,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const getSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!getSession();

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
