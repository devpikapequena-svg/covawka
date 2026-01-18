// src/models/User.ts
import mongoose, { Schema, models, model } from 'mongoose'

export type UserRole = 'user' | 'admin'

export type UserDoc = {
  email: string
  username: string
  passwordHash: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },

    // ✅ ROLE ADICIONADO
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
  },
  { timestamps: true }
)

export const User = models.User || model<UserDoc>('User', UserSchema)
