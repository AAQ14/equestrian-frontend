import api from './axiosInstance';

// Every function returns the response data, so pages do not need to know about axios.

// Body: { firstName, lastName, email, password, phone } -> 201 UserResponse.
export const register = (data) => api.post('/auth/users/register', data).then((res) => res.data);

// Body: { email, code } (6 digits) -> { message }.
export const verifyEmail = (email, code) =>
  api.post('/auth/users/verify', { email, code }).then((res) => res.data);

// Body: { email, password } -> { firstName, lastName, token }.
export const login = (email, password) =>
  api.post('/auth/users/login', { email, password }).then((res) => res.data);

// Body: { email } -> { message }. Sends a 6-digit code by email.
export const forgotPassword = (email) =>
  api.post('/auth/users/forgot-password', { email }).then((res) => res.data);

// Body: { email, code } -> { resetToken }.
export const verifyResetCode = (email, code) =>
  api.post('/auth/users/verify-reset-code', { email, code }).then((res) => res.data);

// The backend reads the reset token from the Authorization header, not the body.
export const resetPassword = (resetToken, password) =>
  api
    .post(
      '/auth/users/reset-password',
      { password },
      { headers: { Authorization: `Bearer ${resetToken}` } }
    )
    .then((res) => res.data);
