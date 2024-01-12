import type SchemaType from './schematype';

export type NodeJSLikeCallback<R, E = any> = (err: E, result?: R) => void

export interface Options {
  lean?: boolean;
  skip?: number;
  limit?: number;
  [key: PropertyKey]: any;
}

export type SchemaTypeOptions = typeof SchemaType<unknown> | SchemaType<unknown> | ((...args: any[]) => any)

export type AddSchemaTypeSimpleOptions = SchemaTypeOptions | { type: SchemaTypeOptions; [key: string]: any };

export type AddSchemaTypeMixedOptions = AddSchemaTypeSimpleOptions | AddSchemaTypeSimpleOptions[];

export interface AddSchemaTypeLoopOptions {
  [key: string]: AddSchemaTypeMixedOptions | AddSchemaTypeLoopOptions;
}

export type AddSchemaTypeOptions = AddSchemaTypeMixedOptions | AddSchemaTypeLoopOptions;

/**
 * @typedef PopulateResult
 * @property {string} path
 * @property {*} model
 */
export type PopulateResult = {
  path: string;
  model: any;
};
