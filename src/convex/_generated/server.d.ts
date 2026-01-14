import type { DataModel } from "./dataModel";
import type { VId } from "convex/values";

/**
 * System database for queries.
 * You can use `ctx.db.get`, `ctx.db.query`, etc. to read from the database.
 */
interface QueryCtx {
  db: {
    get<TableName extends keyof DataModel>(
      id: Id<TableName> | VId<Id<TableName>, any>
    ): Promise<DataModel[TableName] | null>;
    query<TableName extends keyof DataModel>(
      tableName: TableName
    ): QueryBuilder<DataModel[TableName]>;
  };
}

interface QueryBuilder<T> {
  collect(): Promise<T[]>;
  filter(fn: (q: any) => any): QueryBuilder<T>;
  order(direction: "asc" | "desc"): QueryBuilder<T>;
  take(n: number): QueryBuilder<T>;
}

/**
 * System database for mutations.
 * You can use `ctx.db.insert`, `ctx.db.patch`, etc. to write to the database.
 */
interface MutationCtx {
  db: {
    get<TableName extends keyof DataModel>(
      id: Id<TableName> | VId<Id<TableName>, any>
    ): Promise<DataModel[TableName] | null>;
    insert<TableName extends keyof DataModel>(
      tableName: TableName,
      value: Omit<DataModel[TableName], "_id" | "_creationTime">
    ): Promise<Id<TableName>>;
    patch<TableName extends keyof DataModel>(
      id: Id<TableName> | VId<Id<TableName>, any>,
      value: Partial<Omit<DataModel[TableName], "_id" | "_creationTime">> | Record<string, any>
    ): Promise<void>;
    delete<TableName extends keyof DataModel>(id: Id<TableName> | VId<Id<TableName>, any>): Promise<void>;
    query<TableName extends keyof DataModel>(
      tableName: TableName
    ): QueryBuilder<DataModel[TableName]>;
  };
}

type Id<TableName> = string & { __tableName: TableName };

/**
 * Define a query function.
 */
export declare function query<ArgsValidator extends object, ReturnType>(
  config: {
    args?: ArgsValidator;
    handler: (
      ctx: QueryCtx,
      args: ArgsValidator extends Record<string, any>
        ? ArgsValidator
        : Record<string, any>
    ) => ReturnType | Promise<ReturnType>;
  }
): (...args: any[]) => Promise<ReturnType>;

/**
 * Define a mutation function.
 */
export declare function mutation<ArgsValidator extends object, ReturnType>(
  config: {
    args?: ArgsValidator;
    handler: (
      ctx: MutationCtx,
      args: ArgsValidator extends Record<string, any>
        ? ArgsValidator
        : Record<string, any>
    ) => ReturnType;
  }
): (...args: any[]) => Promise<ReturnType>;

export type { QueryCtx, MutationCtx, Id };
