// ==========================================
// 配置常量
// ==========================================
const LOCALAPPCONFIG = {
    ENV: {
        DEV: false
    },
    PATHS: {
        CONFIG_DEV: '/docs/appconfig.localwu.json',
        CONFIG_PROD: '/appconfig.localwu.json'
    },
    TITLE: {
        PLACEHOLDER_PATTERN: /v-\.-\.-/g,
        ____ERROR_PLACEHOLDER_PATTERN: / \| v-\.-\.-/g,
        FALLBACK_SUFFIX: ' | v-.-.-'
    }
};

LOCALAPPCONFIG.ENV.PROD = !LOCALAPPCONFIG.ENV.DEV;

// ==========================================
// 状态管理
// ==========================================
const AppState = {
    APPCONFIG: null,
    isLoading: false,
    error: null
};

// ==========================================
// 工具函数
// ==========================================

/**
 * 构建带缓存清除的URL
 */
function buildCacheBustedUrl(baseUrl) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}_t=${Date.now()}`;
}

/**
 * 获取配置URL（根据环境）
 */
function getConfigUrl() {
    const baseUrl = location.origin; // 使用包含协议的origin
    const configPath = LOCALAPPCONFIG.ENV.DEV ? LOCALAPPCONFIG.PATHS.CONFIG_DEV : LOCALAPPCONFIG.PATHS.CONFIG_PROD;
    return `${baseUrl}${configPath}`;
}

/**
 * 提取版本字符串
 */
function extractVersion(config) {
    if (!config?.version) return null;

    const { major, minor, patch } = config.version;

    // 验证版本号存在且为数字
    if ([major, minor, patch].every(v => typeof v === 'number')) {
        return `v${major}.${minor}.${patch}`;
    }

    return null;
}

// ==========================================
// 核心功能
// ==========================================

/**
 * 获取项目配置
 */
async function fetchAPPCONFIG() {
    if (AppState.isLoading) return null;

    AppState.isLoading = true;
    AppState.error = null;

    const configUrl = getConfigUrl();
    const fetchUrl = buildCacheBustedUrl(configUrl);

    try {
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            // 添加超时控制
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        AppState.APPCONFIG = data;
        return data;
    } catch (error) {
        AppState.error = error;
        handleConfigError(error);
        return null;
    } finally {
        AppState.isLoading = false;
    }
}

/**
 * 错误处理
 */
function handleConfigError(error) {
    console.error('[APPCONFIG] Failed to load:', error);
    // 可扩展：根据错误类型显示不同提示
    const errorMessage = getErrorMessage(error);
    note(errorMessage, 'error');
    // 清理标题中的占位符
    const currentTitle = document.title;
    const cleanTitle = currentTitle.replace(LOCALAPPCONFIG.TITLE.PLACEHOLDER_PATTERN, errorMessage);
    document.title = cleanTitle;
}

/**
 * 获取用户友好的错误信息
 */
function getErrorMessage(error) {
    if (error.name === 'TimeoutError') return '配置加载超时 Config loading timeout';
    if (error.message.includes('404')) return '配置文件未找到 Config not found';
    if (error.message.includes('Failed to fetch')) return '网络连接失败 Network lost';
    return '配置加载失败 Config loading failed';
}

/**
 * 更新页面标题
 */
function updateTitle(versionString) {
    if (!versionString) return false;

    const currentTitle = document.title;

    // 检查是否需要更新
    if (!LOCALAPPCONFIG.TITLE.PLACEHOLDER_PATTERN.test(currentTitle)) {
        console.warn('[Title] No placeholder found in title');
        return false;
    }

    const newTitle = currentTitle.replace(LOCALAPPCONFIG.TITLE.PLACEHOLDER_PATTERN, versionString);
    document.title = newTitle;

    note(`Updated: ${newTitle}`, 'title')
    return true;
}

/**
 * 主初始化函数
 */
async function initApp() {
    const APPCONFIG = await fetchAPPCONFIG();

    if (!APPCONFIG) {
        console.warn('[App] Running without APPCONFIG');
        return false;
    }

    AppState.APPCONFIG = APPCONFIG;
    const version = extractVersion(APPCONFIG);

    if (!version) {
        console.error('[App] Invalid version format in APPCONFIG');
        return false;
    }

    updateTitle(version);
    note(`已加载版本 ${version}`, 'success');

    return true;
}

// ==========================================
// UI 反馈（可扩展）
// ==========================================

function note(message, type = 'info') {
    type = type.toUpperCase();
    if (LOCALAPPCONFIG.ENV.DEV || type === 'ERROR')
        console.log(`[${type}]`, message);

    // // 可实现简单的toast
    // if (typeof window.showToast === 'function') {
    //     window.showToast(message, type);
    // }
}

function toast(message, type = 'info') {
    type = type.toUpperCase();
    if (LOCALAPPCONFIG.ENV.DEV || type === 'ERROR') { }
}

// ==========================================
// 启动应用
// ==========================================

// DOM加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

const DEV_APP = {
    // state: AppState,
    // LOCALAPPCONFIG: LOCALAPPCONFIG,
    // reload: initApp,
    ver: () => extractVersion(AppState.APPCONFIG)
};
const PROD_APP = {
    // state: AppState,
    // LOCALAPPCONFIG: LOCALAPPCONFIG,
    // reload: initApp,
    ver: () => extractVersion(AppState.APPCONFIG)
}

// 暴露全局接口（便于调试和外部调用）
window.App = LOCALAPPCONFIG.ENV.DEV ? DEV_APP : PROD_APP;