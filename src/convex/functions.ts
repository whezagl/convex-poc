import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query to fetch all mock data from the database.
 * This function is called by the View Data page to display data.
 */
export const getMockData = query({
  args: {},
  handler: async (ctx) => {
    const mockData = await ctx.db.query("mockData").collect();
    return mockData;
  },
});

/**
 * Mutation to update an existing mock data record.
 * This function is called by the Update Data page to modify data.
 */
export const updateMockData = mutation({
  args: {
    id: v.id("mockData"),
    name: v.optional(v.string()),
    value: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});
