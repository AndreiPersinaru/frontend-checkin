export const isAuthenticated = () => {
    const token = localStorage.getItem("access_token");
    return !!token;
};

export const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
};

export const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
};
