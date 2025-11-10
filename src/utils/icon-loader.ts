// アイコン読み込みユーティリティ
// 安定した Iconify アイコン読み込みを提供する

interface IconifyLoadOptions {
	timeout?: number;
	retryCount?: number;
	retryDelay?: number;
}

class IconLoader {
	private static instance: IconLoader;
	private isLoaded = false;
	private isLoading = false;
	private loadPromise: Promise<void> | null = null;
	private observers: Set<() => void> = new Set();

	private constructor() {}

	static getInstance(): IconLoader {
		if (!IconLoader.instance) {
			IconLoader.instance = new IconLoader();
		}
		return IconLoader.instance;
	}

	/**
	 * Iconify アイコンライブラリを読み込む
	 */
	async loadIconify(options: IconifyLoadOptions = {}): Promise<void> {
		const { timeout = 10000, retryCount = 3, retryDelay = 1000 } = options;

		// 既に読み込み済みなら即座に戻す
		if (this.isLoaded) {
			return Promise.resolve();
		}

		// 読み込み中であれば既存の Promise を返す
		if (this.isLoading && this.loadPromise) {
			return this.loadPromise;
		}

		this.isLoading = true;
		this.loadPromise = this.loadWithRetry(timeout, retryCount, retryDelay);

		try {
			await this.loadPromise;
			this.isLoaded = true;
			this.notifyObservers();
		} catch (error) {
			console.error("Failed to load Iconify after all retries:", error);
			throw error;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * リトライ機構付き読み込み
	 */
	private async loadWithRetry(
		timeout: number,
		retryCount: number,
		retryDelay: number,
	): Promise<void> {
		for (let attempt = 1; attempt <= retryCount; attempt++) {
			try {
				await this.loadScript(timeout);
				return;
			} catch (error) {
				console.warn(`Iconify load attempt ${attempt} failed:`, error);

				if (attempt === retryCount) {
					throw new Error(
						`Failed to load Iconify after ${retryCount} attempts`,
					);
				}

				// 待機してから再試行する
				await new Promise((resolve) => setTimeout(resolve, retryDelay));
			}
		}
	}

	/**
	 * スクリプトを読み込む
	 */
	private loadScript(timeout: number): Promise<void> {
		return new Promise((resolve, reject) => {
			// 既にスクリプトが存在するかをチェック
			const existingScript = document.querySelector(
				'script[src*="iconify-icon"]',
			);
			if (existingScript) {
				// Iconify が既に利用可能かを確認
				if (this.isIconifyReady()) {
					resolve();
					return;
				}
			}

			const script = document.createElement("script");
			script.src =
				"https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js";
			script.async = true;
			script.defer = true;

			const timeoutId = setTimeout(() => {
				script.remove();
				reject(new Error("Iconify script load timeout"));
			}, timeout);

			script.onload = () => {
				clearTimeout(timeoutId);
				// Iconify の初期化完了を待機
				this.waitForIconifyReady().then(resolve).catch(reject);
			};

			script.onerror = () => {
				clearTimeout(timeoutId);
				script.remove();
				reject(new Error("Failed to load Iconify script"));
			};

			document.head.appendChild(script);
		});
	}

	/**
	 * Iconify の初期化完了を待機する
	 */
	private waitForIconifyReady(maxWait = 5000): Promise<void> {
		return new Promise((resolve, reject) => {
			const startTime = Date.now();

			const checkReady = () => {
				if (this.isIconifyReady()) {
					resolve();
					return;
				}

				if (Date.now() - startTime > maxWait) {
					reject(new Error("Iconify initialization timeout"));
					return;
				}

				setTimeout(checkReady, 100);
			};

			checkReady();
		});
	}

	/**
	 * Iconify が準備完了かをチェックする
	 */
	private isIconifyReady(): boolean {
		return (
			typeof window !== "undefined" &&
			"customElements" in window &&
			customElements.get("iconify-icon") !== undefined
		);
	}

	/**
	 * 読み込み完了のオブザーバーを追加
	 */
	onLoad(callback: () => void): void {
		if (this.isLoaded) {
			callback();
		} else {
			this.observers.add(callback);
		}
	}

	/**
	 * オブザーバーを削除
	 */
	offLoad(callback: () => void): void {
		this.observers.delete(callback);
	}

	/**
	 * 全オブザーバーに通知
	 */
	private notifyObservers(): void {
		this.observers.forEach((callback) => {
			try {
				callback();
			} catch (error) {
				console.error("Error in icon load observer:", error);
			}
		});
		this.observers.clear();
	}

	/**
	 * 読み込み状態を取得
	 */
	getLoadState(): { isLoaded: boolean; isLoading: boolean } {
		return {
			isLoaded: this.isLoaded,
			isLoading: this.isLoading,
		};
	}

	/**
	 * 指定アイコンをプリロードする
	 */
	async preloadIcons(icons: string[]): Promise<void> {
		if (!this.isLoaded) {
			await this.loadIconify();
		}

		// 等待图标加载
		return new Promise((resolve) => {
			let loadedCount = 0;
			const totalIcons = icons.length;

			if (totalIcons === 0) {
				resolve();
				return;
			}

			const checkComplete = () => {
				loadedCount++;
				if (loadedCount >= totalIcons) {
					resolve();
				}
			};

			// 読み込みをトリガーするための一時アイコン要素を作成
			icons.forEach((icon) => {
				const tempIcon = document.createElement("iconify-icon");
				tempIcon.setAttribute("icon", icon);
				tempIcon.style.display = "none";
				tempIcon.onload = checkComplete;
				tempIcon.onerror = checkComplete; // 読み込みに失敗しても処理を続行する
				document.body.appendChild(tempIcon);

				// 一時要素をクリーンアップ
				setTimeout(() => {
					if (tempIcon.parentNode) {
						tempIcon.parentNode.removeChild(tempIcon);
					}
				}, 1000);
			});

			// タイムアウトを設定
			setTimeout(() => {
				resolve();
			}, 5000);
		});
	}
}

// シングルトンインスタンスをエクスポート
export const iconLoader = IconLoader.getInstance();

// 利便性の高い関数をエクスポート
export const loadIconify = (options?: IconifyLoadOptions) =>
	iconLoader.loadIconify(options);
export const preloadIcons = (icons: string[]) => iconLoader.preloadIcons(icons);
export const onIconsReady = (callback: () => void) =>
	iconLoader.onLoad(callback);
