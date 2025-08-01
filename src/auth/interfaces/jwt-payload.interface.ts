export interface JwtPayload {
  sub: string; // Subject (typically user ID)
  email: string;
  iat?: number; // Issued at (optional)
  exp?: number; // Expiration time (optional)
  // Add any other custom claims you put in your JWT
}
