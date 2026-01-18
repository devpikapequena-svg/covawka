// src/lib/requireAdmin.ts
import dbConnect from '@/lib/mongodb'
import { User } from '@/models/User'
import { requireUser } from '@/lib/requireUser'

export async function requireAdmin() {
  const user = await requireUser()
  if (!user) return null

  await dbConnect()
  const doc = await User.findById(user.uid).select('role email username').lean()

  if (!doc) return null
  if (String(doc.role) !== 'admin') return null

  return { uid: String(doc._id), email: String(doc.email), username: String(doc.username) }
}
