import { describe, test, expect } from "bun:test"
import {
  passwordSchema,
  emailSchema,
  phoneInputSchema,
  phoneSchema,
  provinceIdSchema,
  cityIdSchema,
  districtIdSchema,
  reportCategorySchema,
  reportStatusSchema,
  credibilityLevelSchema,
  relationSchema,
  formatPhoneNumber,
  isValidPhoneNumber,
  sanitizeString,
  isValidFileExtension,
} from "../lib/validation"

describe("Validation Schemas", () => {
  describe("passwordSchema", () => {
    test("accepts valid password", () => {
      const result = passwordSchema.safeParse("Test1234")
      expect(result.success).toBe(true)
    })

    test("rejects password without uppercase", () => {
      const result = passwordSchema.safeParse("test1234")
      expect(result.success).toBe(false)
    })

    test("rejects password without lowercase", () => {
      const result = passwordSchema.safeParse("TEST1234")
      expect(result.success).toBe(false)
    })

    test("rejects password without number", () => {
      const result = passwordSchema.safeParse("TestTest")
      expect(result.success).toBe(false)
    })

    test("rejects password less than 8 chars", () => {
      const result = passwordSchema.safeParse("Test1")
      expect(result.success).toBe(false)
    })
  })

  describe("emailSchema", () => {
    test("accepts valid email", () => {
      const result = emailSchema.safeParse("test@example.com")
      expect(result.success).toBe(true)
    })

    test("converts email to lowercase", () => {
      const result = emailSchema.safeParse("Test@Example.COM")
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe("test@example.com")
      }
    })

    test("rejects invalid email", () => {
      const result = emailSchema.safeParse("invalid-email")
      expect(result.success).toBe(false)
    })

    test("rejects email without domain", () => {
      const result = emailSchema.safeParse("test@")
      expect(result.success).toBe(false)
    })
  })

  describe("phoneInputSchema", () => {
    test("accepts valid phone and transforms", () => {
      const result = phoneInputSchema.safeParse("812345678901")
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe("+62812345678901")
      }
    })

    test("rejects phone less than 9 digits", () => {
      const result = phoneInputSchema.safeParse("12345678")
      expect(result.success).toBe(false)
    })

    test("rejects phone more than 12 digits", () => {
      const result = phoneInputSchema.safeParse("1234567890123")
      expect(result.success).toBe(false)
    })
  })

  describe("phoneSchema", () => {
    test("accepts valid phone format", () => {
      const result = phoneSchema.safeParse("+62812345678901")
      expect(result.success).toBe(true)
    })

    test("rejects phone without +62", () => {
      const result = phoneSchema.safeParse("812345678901")
      expect(result.success).toBe(false)
    })
  })

  describe("provinceIdSchema", () => {
    test("accepts 2-char province ID", () => {
      const result = provinceIdSchema.safeParse("32")
      expect(result.success).toBe(true)
    })

    test("rejects invalid length", () => {
      const result = provinceIdSchema.safeParse("123")
      expect(result.success).toBe(false)
    })
  })

  describe("cityIdSchema", () => {
    test("accepts valid city ID", () => {
      const result = cityIdSchema.safeParse("3201")
      expect(result.success).toBe(true)
    })

    test("accepts 5-char city ID", () => {
      const result = cityIdSchema.safeParse("32010")
      expect(result.success).toBe(true)
    })

    test("rejects too short", () => {
      const result = cityIdSchema.safeParse("32")
      expect(result.success).toBe(false)
    })
  })

  describe("districtIdSchema", () => {
    test("accepts valid district ID", () => {
      const result = districtIdSchema.safeParse("3201010")
      expect(result.success).toBe(true)
    })

    test("accepts 8-char district ID", () => {
      const result = districtIdSchema.safeParse("32010101")
      expect(result.success).toBe(true)
    })

    test("rejects too short", () => {
      const result = districtIdSchema.safeParse("3201")
      expect(result.success).toBe(false)
    })
  })

  describe("reportCategorySchema", () => {
    test("accepts valid categories", () => {
      const categories = ["poisoning", "kitchen", "quality", "policy", "implementation", "social"]
      categories.forEach((cat) => {
        const result = reportCategorySchema.safeParse(cat)
        expect(result.success).toBe(true)
      })
    })

    test("rejects invalid category", () => {
      const result = reportCategorySchema.safeParse("invalid")
      expect(result.success).toBe(false)
    })
  })

  describe("reportStatusSchema", () => {
    test("accepts valid statuses", () => {
      const statuses = ["pending", "analyzing", "needs_evidence", "invalid", "in_progress", "resolved"]
      statuses.forEach((status) => {
        const result = reportStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      })
    })

    test("rejects invalid status", () => {
      const result = reportStatusSchema.safeParse("unknown")
      expect(result.success).toBe(false)
    })
  })

  describe("credibilityLevelSchema", () => {
    test("accepts valid levels", () => {
      const levels = ["high", "medium", "low"]
      levels.forEach((level) => {
        const result = credibilityLevelSchema.safeParse(level)
        expect(result.success).toBe(true)
      })
    })

    test("rejects invalid level", () => {
      const result = credibilityLevelSchema.safeParse("unknown")
      expect(result.success).toBe(false)
    })
  })

  describe("relationSchema", () => {
    test("accepts valid relations", () => {
      const relations = ["parent", "teacher", "principal", "supplier", "student", "community", "other"]
      relations.forEach((rel) => {
        const result = relationSchema.safeParse(rel)
        expect(result.success).toBe(true)
      })
    })

    test("rejects invalid relation", () => {
      const result = relationSchema.safeParse("unknown")
      expect(result.success).toBe(false)
    })
  })
})

describe("Utility Functions", () => {
  describe("formatPhoneNumber", () => {
    test("formats phone starting with 0", () => {
      expect(formatPhoneNumber("08123456789")).toBe("+628123456789")
    })

    test("formats phone starting with 62", () => {
      expect(formatPhoneNumber("628123456789")).toBe("+628123456789")
    })

    test("formats phone without prefix", () => {
      expect(formatPhoneNumber("8123456789")).toBe("+628123456789")
    })
  })

  describe("isValidPhoneNumber", () => {
    test("validates correct phone", () => {
      expect(isValidPhoneNumber("08123456789")).toBe(true)
    })

    test("rejects too short", () => {
      expect(isValidPhoneNumber("12345678")).toBe(false)
    })

    test("rejects too long", () => {
      expect(isValidPhoneNumber("1234567890123456")).toBe(false)
    })
  })

  describe("sanitizeString", () => {
    test("escapes HTML tags", () => {
      expect(sanitizeString("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;")
    })

    test("escapes quotes", () => {
      expect(sanitizeString('test "quoted"')).toBe("test &quot;quoted&quot;")
    })

    test("trims whitespace", () => {
      expect(sanitizeString("  test  ")).toBe("test")
    })
  })

  describe("isValidFileExtension", () => {
    test("validates allowed extension", () => {
      expect(isValidFileExtension("test.jpg", ["jpg", "png", "gif"])).toBe(true)
    })

    test("rejects disallowed extension", () => {
      expect(isValidFileExtension("test.exe", ["jpg", "png", "gif"])).toBe(false)
    })

    test("handles uppercase extension", () => {
      expect(isValidFileExtension("test.JPG", ["jpg", "png"])).toBe(true)
    })

    test("handles no extension", () => {
      expect(isValidFileExtension("test", ["jpg", "png"])).toBe(false)
    })
  })
})
