/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as chatMessages from "../chatMessages.js";
import type * as gold from "../gold.js";
import type * as halalGuide from "../halalGuide.js";
import type * as inflation from "../inflation.js";
import type * as investments from "../investments.js";
import type * as pricingPlans from "../pricingPlans.js";
import type * as savingsGoals from "../savingsGoals.js";
import type * as sideHustles from "../sideHustles.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  chatMessages: typeof chatMessages;
  gold: typeof gold;
  halalGuide: typeof halalGuide;
  inflation: typeof inflation;
  investments: typeof investments;
  pricingPlans: typeof pricingPlans;
  savingsGoals: typeof savingsGoals;
  sideHustles: typeof sideHustles;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
