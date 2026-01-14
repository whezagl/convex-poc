import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  mockData: defineTable({
    name: v.string(),
    value: v.string(),
    description: v.string(),
  }).index("by_name", ["name"]),
});
