import type SchemaType from './schematype';

interface Constructor {
  new (...args: any[]): any;
}

export type NodeJSLikeCallback<R, E = any> = (err: E, result?: R) => void;

export interface Options {
  lean: boolean;
  skip: number;
  limit: number;
  match: object;
  sort: any;
  path: string;
  model: string;
}

export type SchemaTypeOptions = typeof SchemaType<unknown> | Constructor;

export type AddSchemaTypeSimpleOptions =
  | SchemaTypeOptions
  | {
      type: SchemaTypeOptions;
      required?: boolean;
      default?: (() => any) | any;
      [key: string]: any;
    };

export type AddSchemaTypeMixedOptions =
  | AddSchemaTypeSimpleOptions
  | []
  | [AddSchemaTypeSimpleOptions];

export interface AddSchemaTypeLoopOptions {
  [key: string]: AddSchemaTypeMixedOptions | AddSchemaTypeLoopOptions;
}

export type AddSchemaTypeOptions =
  | AddSchemaTypeMixedOptions
  | AddSchemaTypeLoopOptions
  | SchemaType<unknown>;

export type queryFilterCallback = (data: unknown) => boolean;

export type queryCallback<T> = (data: T) => void;

export type queryParseCallback<T> = (a: T, b: T) => number;
