export default function copy<T>(obj: T): T {
  if (obj === null) {
    return obj;
  }
  if (obj === undefined) {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  if (obj instanceof Array) {
    return obj.map((n: any) => copy<any>(n)) as any;
  }
  if (typeof obj === "object") {
    const _copy = { ...(obj as { [key: string]: any }) } as {
      [key: string]: any;
    };
    Object.keys(_copy).forEach(key => {
      _copy[key] = copy<any>(_copy[key]);
    });
    return _copy as T;
  }
  return obj;
}
