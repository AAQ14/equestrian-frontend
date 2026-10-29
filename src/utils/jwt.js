// A JWT has 3 parts separated by dots: header.payload.signature.
// The payload is Base64URL-encoded JSON, so we can read it without the secret.
// The backend puts the email in "sub", the role in "role" and the expiry in "exp" (seconds).
// Reading it here is only for the UI; the backend still checks the signature on every request.
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(claims) {
  return !claims || claims.exp * 1000 < Date.now();
}
