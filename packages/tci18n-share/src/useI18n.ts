import { langs, navigatorLang } from './constant';
import { shim } from 'globalthis';

const globalThis = shim();
const useI18n = () => {
    let locale = 'zh-cn';
    let targetLang = locale;
    if (globalThis.localStorage) {
        // 先取本地，再取系统，最后默认
        locale = localStorage.getItem('tci18nLocale') || navigatorLang[navigator.language] || 'zh-cn';
        // url上的语言优先级最高
        targetLang = Object.keys(langs).find((lang: string) => ~location.href.indexOf(lang)) || locale;
        localStorage.setItem('tci18nLocale', targetLang);
    }
    
    const switchLang = (lang: string) => {
        if (targetLang === lang) {
            return
        }
        if (globalThis.localStorage) {
            const [href, search] = location.href.split('?');
            localStorage.setItem('tci18nLocale', lang);
            if (search) {
                if (search.indexOf('lang=') > -1) {
                    globalThis.location.href = `${href}?${search.replace(/lang=[\w\-]+/, `lang=${lang}`)}`;
                } else {
                    globalThis.location.href = `${href}?lang=${lang}&${search}`;
                }
            } else {
                globalThis.location.href = href + `?lang=${lang}`;
            }
            setTimeout(() => {
                globalThis.location.reload();
            }, 100)
        }
    }

    const getLangsList = () => {
        if (globalThis.__tci18n_langs__) {
            return Object.keys(globalThis.__tci18n_langs__).map((key) => ({
                label: langs[key] || key,
                value: key
            }))
        }
        return []
    }

    return {
        switchLang,
        getLangsList,
        langs,
        lang: targetLang,
    }
}

export default useI18n;