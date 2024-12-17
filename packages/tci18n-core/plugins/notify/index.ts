let notifyInstance: Notify;

class Notify<T = Record<string, (...args: any[]) => any>> {
    tapMap: Record<keyof T, T[keyof T][]> = {} as Record<keyof T, T[keyof T][]>;

    static getInstance() {
        if (!notifyInstance) {
            notifyInstance = new Notify();
        }
        return notifyInstance;
    }

    /**
     * 订阅
     * */ 
    tap<D extends keyof T>(name: D, callback: T[D]) {
        const key = String(name);
        if (!this.tapMap[key]) {
            this.tapMap[key] = [];
        }
        this.tapMap[key].push(callback);
        let index = this.tapMap[key].length - 1;
        return () => {
            this.tapMap[key].splice(index, 1);
        }
    }

    /**
     * 取消订阅
     * @param name 
     * @param callback 
     */

    /**
     * 触发全部
     * @param args 
     */
    call(...args: any[]) {
        Object.entries(this.tapMap).forEach(([, callbacks]) => {
            if (Array.isArray(callbacks)) {
                callbacks.forEach((callback) => {
                    if (callback instanceof Function) {
                        callback(...args);
                    }
                })
            }
        });
    }
    
    /**
     * 触发指定
     * @param name 
     * @param args 
     */
    callByName<T>(name: string, ...args: any[]): undefined | void | T[] {
        if (this.tapMap[name]) {
            const ret: T[] = [];
            this.tapMap[name].forEach((callback) => {
                if (callback instanceof Function) {
                    const params = callback(...args);
                    if (params) {
                        ret.push(params);
                    }
                }
            });
            return ret;
        }
        return;
    }

    /**
     * 流式触发，上一个函数处理的结果作为下一个函数的第一个参数
     * @param name 
     * @param args 
     */
    callByNameAsFlow<T>(name: string, arg: T, ...args: any[]): T {
        if (this.tapMap[name]) {
            let _arg = arg;
            for(let i = 0; i < this.tapMap[name].length; i++) {
                const callback = this.tapMap[name][i];
                if (callback instanceof Function) {
                    _arg = callback(_arg, ...args);
                }
            };
            return _arg;
        }
        return arg;
    }
}

export default Notify;