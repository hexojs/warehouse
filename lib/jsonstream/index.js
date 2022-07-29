'use strict';

const through2 = require('through2');
const Parser = require('jsonparse');

/**
 * Check whether a x and y are equal, or x matches y, or x(y) is truthy.
 * @param {boolean | string | RegExp | (args: any[]) => boolean} x
 * @param {*} y
 * @returns {boolean}
 */
const check = (x, y) => {
  if (typeof x === 'string') {
    return y === x;
  }

  if (x && typeof x.exec === 'function') {
    return x.exec(y);
  }

  if (typeof x === 'boolean' || typeof x === 'object') {
    return x;
  }

  if (typeof x === 'function') {
    return x(y);
  }

  return false;
};

module.exports.parse = function(path, map) {
  let header, footer;

  const parser = new Parser();
  const stream = through2.obj(
    (chunk, enc, cb) => {
      if (typeof chunk === 'string') {
        chunk = Buffer.from(chunk);
      }
      parser.write(chunk);
      cb();
    },
    cb => {
      if (header) {
        stream.emit('header', header);
      }
      if (footer) {
        stream.emit('footer', footer);
      }

      if (parser.tState !== Parser.C.START || parser.stack.length > 0) {
        cb(new Error('Incomplete JSON'));
        return;
      }

      cb();
    }
  );

  if (typeof path === 'string') {
    path = path.split('.').map(e => {
      if (e === '$*') {
        return { emitKey: true };
      }
      if (e === '*') {
        return true;
      }
      if (e === '') {
        // '..'.split('.') returns an empty string
        return { recurse: true };
      }
      return e;
    });
  }


  if (!path || !path.length) {
    path = null;
  }

  parser.onValue = function(value) {
    if (!this.root) { stream.root = value; }

    if (!path) return;

    let i = 0; // iterates on path
    let j = 0; // iterates on stack
    let emitKey = false;
    let emitPath = false;
    while (i < path.length) {
      const key = path[i];
      let c;
      j++;

      if (key && !key.recurse) {
        c = j === this.stack.length ? this : this.stack[j];
        if (!c) return;
        if (!check(key, c.key)) {
          setHeaderFooter(c.key, value);
          return;
        }
        emitKey = !!key.emitKey;
        emitPath = !!key.emitPath;
        i++;
      } else {
        i++;
        const nextKey = path[i];
        if (!nextKey) return;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          c = j === this.stack.length ? this : this.stack[j];
          if (!c) return;
          if (check(nextKey, c.key)) {
            i++;
            if (!Object.isFrozen(this.stack[j])) {
              this.stack[j].value = null;
            }
            break;
          } else {
            setHeaderFooter(c.key, value);
          }
          j++;
        }
      }

    }

    // emit header
    if (header) {
      stream.emit('header', header);
      header = false;
    }
    if (j !== this.stack.length) return;

    const actualPath = this.stack.slice(1).map(element => element.key);
    actualPath.push(this.key);

    let data = this.value[this.key];
    if (data != null) {
      if ((data = map ? map(data, actualPath) : data) != null) {
        if (emitKey || emitPath) {
          data = {
            value: data
          };
          if (emitKey) {
            data.key = this.key;
          }
          if (emitPath) {
            data.path = actualPath;
          }
        }

        stream.push(data);
      }
    }

    delete this.value[this.key];

    for (const k in this.stack) {
      if (!Object.isFrozen(this.stack[k])) {
        this.stack[k].value = null;
      }
    }
  };
  parser._onToken = parser.onToken;

  parser.onToken = function(token, value) {
    parser._onToken(token, value);
    if (this.stack.length === 0) {
      if (stream.root) {
        if (!path) { stream.push(stream.root); }

        stream.root = null;
      }
    }
  };

  parser.onError = function(err) {
    if (err.message.includes('at position')) {
      err.message = 'Invalid JSON (' + err.message + ')';
    }
    stream.destroy(err);
  };

  return stream;

  function setHeaderFooter(key, value) {
    // header has not been emitted yet
    if (header !== false) {
      header = header || {};
      header[key] = value;
    }

    // footer has not been emitted yet but header has
    if (footer !== false && header === false) {
      footer = footer || {};
      footer[key] = value;
    }
  }
};
