import { describe, test, expect } from "bun:test"
import { hashPassword, verifyPassword } from "../lib/password"

describe("Password Library", () => {
  describe("hashPassword", () => {
    test("returns a hash string", async () => {
      const hash = await hashPassword("Test1234")
      expect(typeof hash).toBe("string")
      expect(hash.length).toBeGreaterThan(0)
    })

    test("returns different hashes for same password", async () => {
      const hash1 = await hashPassword("Test1234")
      const hash2 = await hashPassword("Test1234")
      expect(hash1).not.toBe(hash2)
    })

    test("hash contains argon2id identifier", async () => {
      const hash = await hashPassword("Test1234")
      expect(hash).toContain("argon2id")
    })
  })

  describe("verifyPassword", () => {
    test("returns true for correct password", async () => {
      const hash = await hashPassword("Test1234")
      const result = await verifyPassword("Test1234", hash)
      expect(result).toBe(true)
    })

    test("returns false for incorrect password", async () => {
      const hash = await hashPassword("Test1234")
      const result = await verifyPassword("WrongPassword", hash)
      expect(result).toBe(false)
    })

    test("returns false for empty password", async () => {
      const hash = await hashPassword("Test1234")
      const result = await verifyPassword("", hash)
      expect(result).toBe(false)
    })

    test("handles special characters in password", async () => {
      const password = "Test@123!#$%"
      const hash = await hashPassword(password)
      const result = await verifyPassword(password, hash)
      expect(result).toBe(true)
    })

    test("handles unicode characters", async () => {
      const password = "Test1234"
      const hash = await hashPassword(password)
      const result = await verifyPassword(password, hash)
      expect(result).toBe(true)
    })
  })
})
