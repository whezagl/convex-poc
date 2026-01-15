import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List all messages, ordered by creation time (newest first)
export const listMessages = query({
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("messages")
      .order("desc")
      .collect();
    return messages;
  },
});

// Get a single message by ID
export const getMessage = query({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create a new message
export const createMessage = mutation({
  args: {
    author: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const newMessageId = await ctx.db.insert("messages", {
      author: args.author,
      body: args.body,
      createdAt: Date.now(),
    });
    return newMessageId;
  },
});

// Update an existing message
export const updateMessage = mutation({
  args: {
    id: v.id("messages"),
    author: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete a message
export const deleteMessage = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
