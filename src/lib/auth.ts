import jwt, { JwtPayload as JwtPayloadLib } from 'jsonwebtoken'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Missing JWT_SECRET in .env.local')
  return secret
}

const JWT_SECRET = getJwtSecret()

/** 🔐 Payload oficial do seu JWT */
export type JwtPayload = {
  uid: string
  email: string
  username: string
  role: 'user' | 'admin'
}

/** assina token */
export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/** type guard forte (runtime-safe) */
function isOurPayload(p: unknown): p is JwtPayload {
  if (!p || typeof p !== 'object') return false
  const obj = p as Record<string, unknown>

  return (
    typeof obj.uid === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.username === 'string' &&
    (obj.role === 'user' || obj.role === 'admin')
  )
}

/** verifica e retorna payload tipado */
export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadLib | string

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload (string)')
  }

  if (!isOurPayload(decoded)) {
    throw new Error('Invalid token payload (shape)')
  }

  return {
    uid: decoded.uid,
    email: decoded.email,
    username: decoded.username,
    role: decoded.role,
  }
}
