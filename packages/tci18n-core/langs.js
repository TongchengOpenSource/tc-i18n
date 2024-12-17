const langs = ${deployCorpusJson}
globalThis.__tci18n_langs__ = {
    ...(globalThis.__tci18n_langs__ || {}),
    ...langs,
};
const getLocale = () => {
const langs = [
    'zh-cn',
    'zh-tw',
    'zh-hk',
    'en-us',
    'en-gb',
    'en-ca',
    'en-in',
    'en-my',
    'en-nz',
    'en-au',
    'en-sg',
    'en-ph',
    'en-hk',
    'ko-kr',
    'ja-jp',
    'fr-fr',
    'th-th',
    'es-es',
    'ru-ru',
    'po-pt',
    'pt-pt',
    'ge-de',
    'de-de',
    'de-at',
    'de-ch',
    'it-it',
    'vi-vi',
    'gr-el',
    'ar-ar',
    'ho-ni',
    'sw-sv',
    'po-pl',
    'in-id',
    'ma-ms',
];
const navigatorLang = {
    'zh-CN': 'zh-cn',
    'zh-TW': 'zh-tw',
    'zh-HK': 'zh-hk',
    'en': 'en-us',
    'en-US': 'en-us',
    'en-GB': 'en-gb',
    'ko': 'ko-kr',
    'ko-KR': 'ko-kr',
    'ja': 'ja-jp',
    'ja-JP': 'ja-jp',
    'fr': 'fr-fr',
    'fr-BE': 'fr-fr',
    'fr-CA': 'fr-fr',
    'fr-LU': 'fr-fr',
    'th': 'th-th',
};
if (globalThis.localStorage) {
    // 浏览器环境
    const locale = globalThis.localStorage.getItem('tci18nLocale') || navigatorLang[globalThis.navigator.language] || 'zh-cn';
    return langs.find((lang) => ~globalThis.location.href.indexOf(lang)) || locale;
}
if (globalThis.wx) {
    // 微信环境
    const locale = wx.getStorageSync('tci18nLocale') || navigatorLang[globalThis.navigator.language] || 'zh-cn';
    return locale;
}
return 'zh-cn';
};
globalThis.__tci18n_locale__ = getLocale();


const isEnable = ${enable};
if (globalThis.location && isEnable) {
    try {
        let alreadyReport = [];
        const cachHref = [];
        const reportData = (pageUrls) => {
            if (pageUrls.length === 0) return;
            const urlMap = {
                hopegoo: '//wwww.hopegoo.com/interdata/collect',
                default: '//www.tc-qf.com/interdata/collect'
            };
            let url = '';
            if (location.host.includes('hopegoo')) {
                url = urlMap.hopegoo;
            } else {
                url = urlMap.default;
            }
            const data = {
                projectId: '${projectId}',
                langs: Object.keys(langs[Object.keys(langs)[0]]).length,
                pageUrl: pageUrls,
                locale: globalThis.__tci18n_locale__,
            };
            if (globalThis.navigator && globalThis.navigator.sendBeacon) {
                navigator.sendBeacon(url, JSON.stringify(data));
            } else if (globalThis.XMLHttpRequest) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(data));
            }
        };
        const locationChange = () => {
            const href = globalThis.location.href;
            if (!cachHref.some((item) => item.url === href) && !alreadyReport.some((item) => item.url === href)) {
                cachHref.push({
                    url: href,
                    createTime: new Date().getTime()
                });
            }
            if (cachHref.length >= (globalThis.navigator.sendBeacon ? 10 : 2)) {
                const notReport = cachHref.filter((item) => !alreadyReport.some((item2) => item2.url === item.url));
                reportData(notReport);
                alreadyReport = alreadyReport.concat(cachHref);
                cachHref.length = 0;
            }
        };
        const locationReplace = (original) => {
            return function(...args) {
                locationChange();
                return original.apply(this, args);
            };
        };
        window.addEventListener('beforeunload', () => {
            const notReport = cachHref.filter((item) => !alreadyReport.includes(item));
            reportData(notReport);
        });
        window.onpopstate = () => {
            locationChange();
        };
        window.onhashchange = () => {
            locationChange();
        };
        const replaceOld = (source, name, replacement, isForced) => {
            if (source === undefined) return;
            if (name in source || isForced) {
                const original = source[name];
                const wrapped = replacement(original);
                if (typeof wrapped === 'function') {
                    source[name] = wrapped;
                }
            }
        };
        replaceOld(globalThis.history, 'pushState', locationReplace);
        replaceOld(globalThis.history, 'replaceState', locationReplace);
    } catch(e) {
        console.warn(`请联系贴心小译平台`, e);
    }
}