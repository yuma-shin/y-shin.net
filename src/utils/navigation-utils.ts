/**
 * ナビゲーションユーティリティ関数
 * Swup を用いた高速（無刷新）ナビゲーションを含むページ遷移機能を提供する
 */

/**
 * 指定ページに遷移する
 * @param url 目的地のページ URL
 * @param options ナビゲーションオプション
 */
export function navigateToPage(
	url: string,
	options?: {
		replace?: boolean;
		force?: boolean;
	},
): void {
	// URL が有効かをチェック
	if (!url || typeof url !== "string") {
		console.warn("navigateToPage: Invalid URL provided");
		return;
	}

	// 外部リンクの場合は直接新しいタブで開く
	if (
		url.startsWith("http://") ||
		url.startsWith("https://") ||
		url.startsWith("//")
	) {
		window.open(url, "_blank");
		return;
	}

	// アンカーリンクの場合は対応する要素までスムーズスクロールする
	if (url.startsWith("#")) {
		const element = document.getElementById(url.slice(1));
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
		return;
	}

	// Swup が利用可能かをチェック
	if (typeof window !== "undefined" && (window as any).swup) {
		try {
			// Swup を使ってフラッシュなしで遷移する
			if (options?.replace) {
				(window as any).swup.navigate(url, { history: false });
			} else {
				(window as any).swup.navigate(url);
			}
		} catch (error) {
			console.error("Swup navigation failed:", error);
				// 通常のページ遷移へフォールバックする
			fallbackNavigation(url, options);
		}
	} else {
		// Swup が利用できない場合のフォールバック処理
		fallbackNavigation(url, options);
	}
}

/**
 * フォールバックナビゲーション関数
 * Swup が利用できない場合に通常のページ遷移を行う
 */
function fallbackNavigation(
	url: string,
	options?: {
		replace?: boolean;
		force?: boolean;
	},
): void {
	if (options?.replace) {
		window.location.replace(url);
	} else {
		window.location.href = url;
	}
}

/**
 * Swup が準備完了かを判定する
 */
export function isSwupReady(): boolean {
	return typeof window !== "undefined" && !!(window as any).swup;
}

/**
 * Swup の準備完了を待機する
 * @param timeout タイムアウト時間（ミリ秒）
 */
export function waitForSwup(timeout: number = 5000): Promise<boolean> {
	return new Promise((resolve) => {
		if (isSwupReady()) {
			resolve(true);
			return;
		}

		let timeoutId: NodeJS.Timeout;

		const checkSwup = () => {
			if (isSwupReady()) {
				clearTimeout(timeoutId);
				document.removeEventListener("swup:enable", checkSwup);
				resolve(true);
			}
		};

		// Swup の有効化イベントを監視
		document.addEventListener("swup:enable", checkSwup);

		// 设置超时
		timeoutId = setTimeout(() => {
			document.removeEventListener("swup:enable", checkSwup);
			resolve(false);
		}, timeout);
	});
}

/**
 * ページをプリロードする
 * @param url プリロードするページの URL
 */
export function preloadPage(url: string): void {
	if (!url || typeof url !== "string") {
		return;
	}

	// Swup が利用可能ならそのプリロード機能を使う
	if (isSwupReady() && (window as any).swup.preload) {
		try {
			(window as any).swup.preload(url);
		} catch (error) {
			console.warn("Failed to preload page:", error);
		}
	}
}

/**
 * 現在のページパスを取得する
 */
export function getCurrentPath(): string {
	return typeof window !== "undefined" ? window.location.pathname : "";
}

/**
 * ルート（ホーム）かどうかを判定する
 */
export function isHomePage(): boolean {
	const path = getCurrentPath();
	return path === "/" || path === "";
}

/**
 * 記事ページかどうかを判定する
 */
export function isPostPage(): boolean {
	const path = getCurrentPath();
	return path.startsWith("/posts/");
}

/**
 * 2 つのパスが等しいかを判定する
 */
export function pathsEqual(path1: string, path2: string): boolean {
	// 标准化路径（移除末尾斜杠）
	const normalize = (path: string) => {
		return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
	};

	return normalize(path1) === normalize(path2);
}
