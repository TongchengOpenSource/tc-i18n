import { useI18n } from '@tc-i18n/share';
import { intl } from './index';

export { useI18n, intl };

declare global {
    interface Window {
        __tci18n_locale__: string;
        __tci18n_langs__: any;
    }
    interface global{
        __tci18n_locale__: string;
        __tci18n_langs__: any;
    }
    interface globalThis {
        __tci18n_locale__: string;
        __tci18n_langs__: any;
    }
}