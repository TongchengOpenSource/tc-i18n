export interface IAppConfig {
    env: string;
    appName: string;
    slogan: string;
    requestSuccessCode: number;
    theme: boolean; // 开启主题切换
    darkMode: boolean; // 开启暗黑模式
    autoDarkMode: boolean; // 开启自动切换暗黑模式
}

export default {
    env: import.meta.env.VITE_APP_ENV, // 当前环境
    appName: '贴心小译',
    slogan: '多语言解决方案',
    requestSuccessCode: 10000,
    theme: true, // 开启主题切换
    darkMode: true, // 开启暗黑模式
    autoDarkMode: true, // 开启自动切换暗黑模式
};
