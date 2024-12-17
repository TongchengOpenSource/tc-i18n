import fs from 'fs';
import path from 'path';

interface VueQuery {
    vue?: boolean
    src?: string
    type?: 'script' | 'template' | 'style' | 'custom'
    index?: number
    lang?: string
    raw?: boolean
    url?: boolean
    scoped?: boolean
    id?: string
}

class Utils {
    static formatPath = (p) => {
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

    static existsSync(filePath: string) {
        return fs.existsSync(filePath);
    }

    static readFileSync(filePath: string) {
        return fs.readFileSync(filePath, 'utf-8');
    }

    static join(...args: string[]) {
        return path.join(...args);
    }
    
    static resolve(...args: string[]) {
        return path.resolve(...args);
    }
    
    static parseVueRequest(id: string): {
        filename: string
        query: VueQuery
      } {
        const [filename, rawQuery] = id.split(`?`, 2)
        const query = Object.fromEntries(new URLSearchParams(rawQuery)) as VueQuery
        if (query.vue != null) {
          query.vue = true
        }
        if (query.index != null) {
          query.index = Number(query.index)
        }
        if (query.raw != null) {
          query.raw = true
        }
        if (query.url != null) {
          query.url = true
        }
        if (query.scoped != null) {
          query.scoped = true
        }
        return {
          filename,
          query,
        }
    }
    
};

export default Utils;