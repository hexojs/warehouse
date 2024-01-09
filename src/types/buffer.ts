import SchemaType from '../schematype';
import ValidationError from '../error/validation';

/**
 * Boolean schema type.
 */
class SchemaTypeBuffer extends SchemaType<Buffer> {
  options: SchemaType<Buffer>['options'] & { encoding: BufferEncoding; };

  /**
   * @param {string} name
   * @param {object} [options]
   *   @param {boolean} [options.required=false]
   *   @param {boolean|Function} [options.default]
   *   @param {string} [options.encoding=hex]
   */
  constructor(name: string, options?: Partial<SchemaType<Buffer>['options']> & { encoding?: BufferEncoding; }) {
    super(name, Object.assign({
      encoding: 'hex'
    }, options));
  }

  /**
   * Casts data.
   *
   * @param {*} value_
   * @param {Object} data
   * @return {Buffer}
   */
  cast(value_: WithImplicitCoercion<Uint8Array | ReadonlyArray<number> | string>, data?: unknown): Buffer;
  cast(value_?: unknown, data?: unknown): Buffer | undefined;
  cast(value_?: unknown, data?: unknown): Buffer | undefined {
    const value = super.cast(value_, data);

    if (value == null || Buffer.isBuffer(value)) return value as Buffer | undefined;
    if (typeof value === 'string') return Buffer.from(value, this.options.encoding);
    if (Array.isArray(value)) return Buffer.from(value);
  }

  /**
   * Validates data.
   *
   * @param {*} value_
   * @param {Object} data
   * @return {Buffer}
   */
  validate(value_: unknown, data?: unknown): Buffer {
    const value = super.validate(value_, data);

    if (!Buffer.isBuffer(value)) {
      throw new ValidationError(`\`${value}\` is not a valid buffer!`);
    }

    return value;
  }

  /**
   * Compares between two buffers.
   *
   * @param {Buffer} a
   * @param {Buffer} b
   * @return {Number}
   */
  compare(a?: Buffer, b?: Buffer): number {
    if (Buffer.isBuffer(a)) {
      return Buffer.isBuffer(b) ? a.compare(b) : 1;
    }

    return Buffer.isBuffer(b) ? -1 : 0;
  }

  /**
   * Parses data and transform them into buffer values.
   *
   * @param {*} value
   * @return {Boolean}
   */
  parse(value: WithImplicitCoercion<Uint8Array | ReadonlyArray<number> | string>): Buffer;
  parse(value?: unknown): Buffer | null | undefined;
  parse(value?: any): Buffer | null | undefined {
    return value ? Buffer.from(value, this.options.encoding) : value;
  }

  /**
   * Transforms data into number to compress the size of database files.
   *
   * @param {Buffer} value
   * @return {String}
   */
  value(value?: Buffer): string {
    return Buffer.isBuffer(value) ? value.toString(this.options.encoding) : value;
  }

  /**
   * Checks the equality of data.
   *
   * @param {Buffer} value
   * @param {Buffer} query
   * @return {Boolean}
   */
  match(value: Buffer, query: Buffer): boolean {
    if (Buffer.isBuffer(value) && Buffer.isBuffer(query)) {
      return value.equals(query);
    }

    return value === query;
  }
}

export default SchemaTypeBuffer;
