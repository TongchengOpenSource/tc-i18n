import File from './File';
import path from 'path';
class Utils extends File {
    isType(value: any, type: string) {
        return Object.prototype.toString.call(value).slice(8, -1).toLowerCase() === type.toLowerCase();
    }

    isObject(obj: any): obj is Object {
        return this.isType(obj, 'object');
    }

    isString(str: any): str is string{
        return this.isType(str, 'string');
    }

    isFunction(fn: any): fn is Function{
        return this.isType(fn, 'function');
    }

    isArray(arr: any): arr is any[]{
        return this.isType(arr, 'array');
    }

    isNumber(num: any): num is number{
        return this.isType(num, 'number');
    }

    isBoolean(bool: any): bool is boolean{
        return this.isType(bool, 'boolean');
    }

    isUndefined(undef: any): undef is undefined{
        return this.isType(undef, 'undefined');
    }

    isNull(nul: any): nul is null{
        return this.isType(nul, 'null');
    }

    isSymbol(sym: any): sym is symbol{
        return this.isType(sym, 'symbol');
    }

    isRegExp(reg: any): reg is RegExp{
        return this.isType(reg, 'regexp');
    }

    isPromise(promise: any): promise is Promise<any>{
        return this.isType(promise, 'promise');
    }

    relativePath(from: string, to: string) {
        return path.relative(from, to);
    }

    dirnamePath(dirname: string) {
        return path.dirname(dirname);
    }

    nodeModulesPath(file: string) {
        return path.resolve(process.cwd(), './node_modules', file);
    }

    joinPath(...args: string[]) {
        return path.join(...args);
    }

    formatPath = (p: string) => {
        if (p && typeof p === 'string') {
            const sep = path.sep
            if (sep === '/') {
                return p
            } else {
                return p.replace(/\\/g, '/')
            }
        }
        return p
    }
}

export default Utils;