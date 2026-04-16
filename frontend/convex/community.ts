import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPost = mutation({
  args: {
    userId: v.id("users"),
    authorName: v.string(),
    authorAvatar: v.optional(v.string()),
    content: v.string(),
    imageBase64: v.optional(v.string()),
    category: v.union(
      v.literal("tip"),
      v.literal("question"),
      v.literal("success"),
      v.literal("discussion"),
      v.literal("news")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("communityPosts", {
      ...args,
      likesCount: 0,
      commentsCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const getFeed = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("communityPosts").collect();
    return posts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getUserPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("communityPosts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const deletePost = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("communityComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);
    const likes = await ctx.db
      .query("communityLikes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const l of likes) await ctx.db.delete(l._id);
    await ctx.db.delete(args.postId);
  },
});

export const toggleLike = mutation({
  args: {
    postId: v.id("communityPosts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("communityLikes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();
    const post = await ctx.db.get(args.postId);
    if (!post) return;
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.postId, { likesCount: Math.max(0, post.likesCount - 1) });
      return false;
    } else {
      await ctx.db.insert("communityLikes", {
        postId: args.postId,
        userId: args.userId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.postId, { likesCount: post.likesCount + 1 });
      return true;
    }
  },
});

export const hasLiked = query({
  args: {
    postId: v.id("communityPosts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("communityLikes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();
    return !!like;
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("communityPosts"),
    userId: v.id("users"),
    authorName: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("communityComments", {
      ...args,
      createdAt: Date.now(),
    });
    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, { commentsCount: post.commentsCount + 1 });
    }
  },
});

export const getComments = query({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("communityComments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    return comments.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const toggleFollow = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.followerId === args.followingId) return false;
    const existing = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("follows", { ...args, createdAt: Date.now() });
      return true;
    }
  },
});

export const getFollowerCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();
    return followers.length;
  },
});

export const getFollowingCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();
    return following.length;
  },
});

export const isFollowing = query({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const f = await ctx.db
      .query("follows")
      .withIndex("by_pair", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .first();
    return !!f;
  },
});
