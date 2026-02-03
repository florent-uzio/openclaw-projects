const TOKEN_KEY = 'x-bookmarks-token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function login(password: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      return false;
    }

    const { token } = await response.json();
    setToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function verifyToken(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function logout(): void {
  clearToken();
  window.location.reload();
}
