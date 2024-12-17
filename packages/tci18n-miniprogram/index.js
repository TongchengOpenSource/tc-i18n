import { langs } from './constant.js'

const LOCALE_KEY = "LOCALE";
const LANGS_KEY = "LANGS";

function Tci18nPage(pageObject) {
  // 在这里，你可以添加一些自定义的逻辑，比如添加一些公共的数据或者方法
    // ...
    const hooks = {
		data: {
			...(pageObject.data || {}),
			[LOCALE_KEY]: globalThis.__tci18n_locale__ || wx.getStorageSync('tci18nLocale') || 'zh-cn',
			[LANGS_KEY]: globalThis.__tci18n_langs__ || wx.getStorageSync('tci18nLangs') || {},
		},
    }
  // 然后，调用原生的Page函数来创建页面
  Page(Object.assign({}, pageObject, hooks));
}

function Tci18nComponent(pageObject) {
	// 在这里，你可以添加一些自定义的逻辑，比如添加一些公共的数据或者方法
	  // ...
	const hooks = {
		data: {
			...(pageObject.data || {}),
			[LOCALE_KEY]: globalThis.__tci18n_locale__ || wx.getStorageSync('tci18nLocale') || 'zh-cn',
			[LANGS_KEY]: globalThis.__tci18n_langs__ || wx.getStorageSync('tci18nLangs') || {},
		},
	}
	// 然后，调用原生的Page函数来创建页面
	Component(Object.assign({}, pageObject, hooks));
  }

const intl = {
	langs: null,
	locale: null,
	init(langs, locale) {
		intl.langs = langs;
		intl.locale = locale;
		globalThis.__tci18n_langs__ = langs;
		globalThis.__tci18n_locale__ = locale;
	},
	t(key, variables) {
		if (!intl.langs && globalThis.__tci18n_langs__) {
			intl.langs = globalThis.__tci18n_langs__
		}
		if (!intl.locale && globalThis.__tci18n_locale__) {
			intl.locale = globalThis.__tci18n_locale__
		}
		if (intl.langs && intl.locale) {
			const message = intl.langs[intl.locale];
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
}

const splitKey = (key) => {
	if (typeof key === 'string' && key.indexOf('#!!!#') > -1) {
			const [value, filePathIndex] = key.split('#!!!#')
			let filePath = ''
			let index = ''
			if (filePathIndex) {
					const splitIndex = filePathIndex.lastIndexOf('_')
					filePath = filePathIndex.slice(0, splitIndex)
					index = filePathIndex.slice(splitIndex + 1)
			}
			return [value, filePath, index]
	}
	return [key, '', '']
}

const useI18n = () => {
	const targetLang = globalThis.__tci18n_locale__ || wx.getStorageSync('tci18nLocale') || 'zh-cn';
    const getLangsList = () => {
        if (globalThis.__tci18n_langs__) {
            return Object.keys(globalThis.__tci18n_langs__).map((key) => ({
                label: langs[key] || key,
                value: key
            }))
        }
        return []
    }
	const switchLang = (lang) => {
		if (targetLang === lang) {
			return;
		}
		wx.setStorageSync('tci18nLocale', lang);
	}
	return {
		lang: targetLang,
		switchLang,
		getLangsList
	}

}

export { Tci18nPage, Tci18nComponent, intl, LOCALE_KEY, LANGS_KEY, useI18n };