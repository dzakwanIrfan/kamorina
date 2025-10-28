export const syncTokenToCookie = (token: string | null) => {
  if (typeof window !== 'undefined') {
    if (token) {
      // Set cookie untuk 7 hari
      document.cookie = `accessToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      // Hapus cookie
      document.cookie = 'accessToken=; path=/; max-age=0';
    }
  }
};