type SwitchLang = (lang: string) => void
type GetLangsList = () => Array<Record<string, string>>

declare function useI18n(): {
    switchLang: SwitchLang,
    getLangsList: GetLangsList,
    lang: string,
    elementPlusLang: any,
    elementLang: any,
    iviewLang: any,
    antdLang: any,
}

declare function splitKey(key: string): [string, string, string];

export {
    useI18n,
    splitKey
}
declare global {
    interface Window {
        __tci18n_locale__: string;
        __tci18n_langs__: any;
    }
    interface global {
        __tci18n_locale__: string;
        __tci18n_langs__: any;
    }
    interface globalThis {
        __tci18n_locale__: string;
        __tci18n_langs__: any;
    }
}
