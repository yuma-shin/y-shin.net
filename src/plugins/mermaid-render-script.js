(() => {
	// シングルトンパターン：既に初期化済みかチェック
	if (window.mermaidInitialized) {
		return;
	}

	window.mermaidInitialized = true;

	// 現在のテーマ状態を記録し、不要な再レンダリングを防止
	let currentTheme = null;
	let isRendering = false; // 並行レンダリングを防止
	let retryCount = 0;
	const MAX_RETRIES = 3;
	const RETRY_DELAY = 1000; // 1秒

	// テーマが実際に変更されたかチェック
	function hasThemeChanged() {
		const isDark = document.documentElement.classList.contains("dark");
		const newTheme = isDark ? "dark" : "default";

		if (currentTheme !== newTheme) {
			currentTheme = newTheme;
			return true;
		}
		return false;
	}

	// Mermaidライブラリの読み込み完了を待機
	function waitForMermaid(timeout = 10000) {
		return new Promise((resolve, reject) => {
			const startTime = Date.now();

			function check() {
				if (window.mermaid && typeof window.mermaid.initialize === "function") {
					resolve(window.mermaid);
				} else if (Date.now() - startTime > timeout) {
					reject(new Error("Mermaid library failed to load within timeout"));
				} else {
					setTimeout(check, 100);
				}
			}

			check();
		});
	}

	// MutationObserverを設定してhtml要素のclass属性の変更を監視
	function setupMutationObserver() {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (
					mutation.type === "attributes" &&
					mutation.attributeName === "class"
				) {
					// darkクラスの変更をチェック
					const target = mutation.target;
					const wasDark = mutation.oldValue
						? mutation.oldValue.includes("dark")
						: false;
					const isDark = target.classList.contains("dark");

					if (wasDark !== isDark) {
						if (hasThemeChanged()) {
							// テーマ切り替え時のちらつきを防ぐため遅延レンダリング
							setTimeout(() => renderMermaidDiagrams(), 150);
						}
					}
				}
			});
		});

		// html要素のclass属性変更の監視を開始
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
			attributeOldValue: true,
		});
	}

	// その他のイベントリスナーを設定
	function setupEventListeners() {
		// ページ遷移を監視
		document.addEventListener("astro:page-load", () => {
			// テーマ状態を再初期化
			currentTheme = null;
			retryCount = 0; // リトライカウントをリセット
			if (hasThemeChanged()) {
				setTimeout(() => renderMermaidDiagrams(), 100);
			}
		});

		// ページの可視性変更を監視し、再表示時に再レンダリング
		document.addEventListener("visibilitychange", () => {
			if (!document.hidden) {
				setTimeout(() => renderMermaidDiagrams(), 200);
			}
		});
	}

	async function initializeMermaid() {
		try {
			await waitForMermaid();

			// Mermaid設定を初期化
			window.mermaid.initialize({
				startOnLoad: false,
				theme: "default",
				themeVariables: {
					fontFamily: "inherit",
					fontSize: "16px",
				},
				securityLevel: "loose",
				// 添加错误处理配置
				errorLevel: "warn",
				logLevel: "error",
			});

			// 渲染所有 Mermaid 图表
			await renderMermaidDiagrams();
		} catch (error) {
			console.error("Failed to initialize Mermaid:", error);
			// 如果初始化失败，尝试重新加载
			if (retryCount < MAX_RETRIES) {
				retryCount++;
				setTimeout(() => initializeMermaid(), RETRY_DELAY * retryCount);
			}
		}
	}

	async function renderMermaidDiagrams() {
		// 防止并发渲染
		if (isRendering) {
			return;
		}

		// 检查 Mermaid 是否可用
		if (!window.mermaid || typeof window.mermaid.render !== "function") {
			console.warn("Mermaid not available, skipping render");
			return;
		}

		isRendering = true;

		try {
			const mermaidElements = document.querySelectorAll(
				".mermaid[data-mermaid-code]",
			);

			if (mermaidElements.length === 0) {
				isRendering = false;
				return;
			}

			// 延迟检测主题，确保 DOM 已经更新
			await new Promise((resolve) => setTimeout(resolve, 100));

			const htmlElement = document.documentElement;
			const isDark = htmlElement.classList.contains("dark");
			const theme = isDark ? "dark" : "default";

			// 更新 Mermaid 主题（只需要更新一次）
			window.mermaid.initialize({
				startOnLoad: false,
				theme: theme,
				themeVariables: {
					fontFamily: "inherit",
					fontSize: "16px",
					// 强制应用主题变量
					primaryColor: isDark ? "#ffffff" : "#000000",
					primaryTextColor: isDark ? "#ffffff" : "#000000",
					primaryBorderColor: isDark ? "#ffffff" : "#000000",
					lineColor: isDark ? "#ffffff" : "#000000",
					secondaryColor: isDark ? "#333333" : "#f0f0f0",
					tertiaryColor: isDark ? "#555555" : "#e0e0e0",
				},
				securityLevel: "loose",
				errorLevel: "warn",
				logLevel: "error",
			});

			// 批量渲染所有图表，添加重试机制
			const renderPromises = Array.from(mermaidElements).map(
				async (element, index) => {
					let attempts = 0;
					const maxAttempts = 3;

					while (attempts < maxAttempts) {
						try {
							const code = element.getAttribute("data-mermaid-code");

							if (!code) {
								break;
							}

							// 显示加载状态
							element.innerHTML =
								'<div class="mermaid-loading">Rendering diagram...</div>';

							// 渲染图表
							const { svg } = await window.mermaid.render(
								`mermaid-${Date.now()}-${index}-${attempts}`,
								code,
							);

							element.innerHTML = svg;

							// 添加响应式支持
							const svgElement = element.querySelector("svg");
							if (svgElement) {
								svgElement.setAttribute("width", "100%");
								svgElement.removeAttribute("height");
								svgElement.style.maxWidth = "100%";
								svgElement.style.height = "auto";

								// 强制应用样式
								if (isDark) {
									svgElement.style.filter = "brightness(0.9) contrast(1.1)";
								} else {
									svgElement.style.filter = "none";
								}
							}

							// 渲染成功，跳出重试循环
							break;
						} catch (error) {
							attempts++;
							console.warn(
								`Mermaid rendering attempt ${attempts} failed for element ${index}:`,
								error,
							);

							if (attempts >= maxAttempts) {
								console.error(
									`Failed to render Mermaid diagram after ${maxAttempts} attempts:`,
									error,
								);
								element.innerHTML = `
									<div class="mermaid-error">
										<p>Failed to render diagram after ${maxAttempts} attempts.</p>
										<button onclick="location.reload()" style="margin-top: 8px; padding: 4px 8px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
											Retry Page
										</button>
									</div>
								`;
							} else {
								// 等待一段时间后重试
								await new Promise((resolve) =>
									setTimeout(resolve, 500 * attempts),
								);
							}
						}
					}
				},
			);

			// 等待所有渲染完成
			await Promise.all(renderPromises);
			retryCount = 0; // 重置重试计数
		} catch (error) {
			console.error("Error in renderMermaidDiagrams:", error);

			// 如果渲染失败，尝试重新渲染
			if (retryCount < MAX_RETRIES) {
				retryCount++;
				setTimeout(() => renderMermaidDiagrams(), RETRY_DELAY * retryCount);
			}
		} finally {
			isRendering = false;
		}
	}

	// 初始化主题状态
	function initializeThemeState() {
		const isDark = document.documentElement.classList.contains("dark");
		currentTheme = isDark ? "dark" : "default";
	}

	// 加载 Mermaid 库
	async function loadMermaid() {
		if (typeof window.mermaid !== "undefined") {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src =
				"https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";

			script.onload = () => {
				console.log("Mermaid library loaded successfully");
				resolve();
			};

			script.onerror = (error) => {
				console.error("Failed to load Mermaid library:", error);
				// 尝试备用 CDN
				const fallbackScript = document.createElement("script");
				fallbackScript.src = "https://unpkg.com/mermaid@11/dist/mermaid.min.js";

				fallbackScript.onload = () => {
					console.log("Mermaid library loaded from fallback CDN");
					resolve();
				};

				fallbackScript.onerror = () => {
					reject(
						new Error(
							"Failed to load Mermaid from both primary and fallback CDNs",
						),
					);
				};

				document.head.appendChild(fallbackScript);
			};

			document.head.appendChild(script);
		});
	}

	// 主初始化函数
	async function initialize() {
		try {
			// 设置监听器
			setupMutationObserver();
			setupEventListeners();

			// 初始化主题状态
			initializeThemeState();

			// 加载并初始化 Mermaid
			await loadMermaid();
			await initializeMermaid();
		} catch (error) {
			console.error("Failed to initialize Mermaid system:", error);
		}
	}

	// 启动初始化
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initialize);
	} else {
		initialize();
	}
})();
