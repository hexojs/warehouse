class Mutex {
  private _locked: boolean;
  private readonly _queue: (() => void)[];
  constructor() {
    this._locked = false;
    this._queue = [];
  }

  lock(fn: () => void) {
    if (this._locked) {
      this._queue.push(fn);
      return;
    }

    this._locked = true;
    fn();
  }

  unlock() {
    if (!this._locked) return;

    const next = this._queue.shift();

    if (next) {
      next();
    } else {
      this._locked = false;
    }
  }
}

export = Mutex;
