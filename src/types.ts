type NodeJSLikeCallback<R, E = any> = (err: E, result?: R) => void

interface Options {
  lean?: boolean;
  skip?: number;
  limit?: number;
  [key: PropertyKey]: any;
}
