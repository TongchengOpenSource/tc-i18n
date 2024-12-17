import { splitKey, useI18n } from '@tc-i18n/share';
import { shim } from 'globalthis';

const globalThis = shim();
export class Intl {
    langs: null | Record<string, Record<string, string>> = null;
    locale: null | string = null;
    init(options: {langs?: Record<string, Record<string, string>>, locale?: string} = {}) {
      if (options.langs) {
        this.langs = options.langs;
      }
      if (options.locale) {
        this.locale = options.locale;
      }
    }
    t(key: string, variables?: any) {
      if (!this.langs && globalThis.__tci18n_langs__) {
        this.langs = globalThis.__tci18n_langs__
      }
      if (!this.locale && globalThis.__tci18n_locale__) {
        this.locale = globalThis.__tci18n_locale__
      }
      if (this.langs && this.locale) {
        const message = this.langs[this.locale];
        if (message && message[key]) {
          let msg = message[key];
          if (variables && Object.keys(variables).length) {
            Object.keys(variables).forEach((k) => {
              msg = msg.replace(`{${k}}`, variables[k]);
            })
          }
          return msg
        } else {
          let [ value ] = splitKey(key)
          if (variables && Object.keys(variables).length) {
            Object.keys(variables).forEach((k) => {
              value = value.replace(`{${k}}`, variables[k]);
            })
          }
          return value
        }
      }
      return splitKey(key)[0] || '';
    }

    $t(key: string, variables?: any) {
        return this.t(key, variables);
    }
}

const intl: Intl = new Intl();

globalThis.intl = intl;

export { intl, useI18n };