// タイムライン水平スクロール処理スクリプト
// timeline-horizontal-scroll クラスを持つ要素のマウスホイールによる水平スクロールを処理する

(() => {
	// イベントバインド済み要素を保持し、重複バインドを防止
	const boundElements = new Set();

	// マウスホイールイベントの処理関数
	function handleWheel(e) {
		// 水平スクロールコンテナかどうかを確認
		if (!this.classList.contains("timeline-horizontal-scroll")) {
			return;
		}

		// デフォルトの垂直スクロールを防止
		if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
			e.preventDefault();
			// 垂直スクロールを水平スクロールに変換
			this.scrollLeft += e.deltaY;
		}
	}

	// スクロール機能の初期化関数
	function initTimelineScroll() {
		// タイムライン水平スクロールコンテナを全て検索
		var scrollContainers = document.querySelectorAll(
			".timeline-horizontal-scroll",
		);

		scrollContainers.forEach((scrollContainer) => {
			// 要素が既にイベントバインド済みかチェック
			if (boundElements.has(scrollContainer)) {
				return;
			}

			// デスクトップ環境かどうかを検出
			var isDesktop = window.matchMedia("(min-width: 768px)").matches;

			if (isDesktop) {
				// 重複バインドを防ぐため、既存のイベントリスナーを削除
				scrollContainer.removeEventListener("wheel", handleWheel);

				// 新しいイベントリスナーを追加
				scrollContainer.addEventListener("wheel", handleWheel, {
					passive: false,
				});

				// 要素をバインド済みとしてマーク
				boundElements.add(scrollContainer);
			}
		});
	}

	// 清理函数，用于页面切换时清理已绑定的元素
	function cleanupBoundElements() {
		boundElements.clear();
	}

	// 页面加载完成后初始化
	document.addEventListener("DOMContentLoaded", () => {
		initTimelineScroll();

		// 在DOM更新后再次初始化（处理SWUP等SPA场景）
		setTimeout(initTimelineScroll, 100);
	});

	// 监听可能的DOM变化
	if (typeof MutationObserver !== "undefined") {
		var observer = new MutationObserver((mutations) => {
			var shouldInit = false;

			mutations.forEach((mutation) => {
				if (mutation.type === "childList") {
					// 检查是否有新的时间线元素被添加
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === 1) {
							// 检查直接添加的节点
							if (node.classList?.contains("timeline-horizontal-scroll")) {
								shouldInit = true;
							}
							// 检查节点内的子元素
							if (node.querySelectorAll) {
								var timelineElements = node.querySelectorAll(
									".timeline-horizontal-scroll",
								);
								if (timelineElements.length > 0) {
									shouldInit = true;
								}
							}
						}
					});
				}
			});

			if (shouldInit) {
				setTimeout(initTimelineScroll, 50);
			}
		});

		// 观察整个文档的变化
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	// 监听页面导航事件
	window.addEventListener("load", () => {
		cleanupBoundElements();
		setTimeout(initTimelineScroll, 100);
	});

	// 处理浏览器前进/后退导航
	window.addEventListener("pageshow", (event) => {
		if (event.persisted) {
			cleanupBoundElements();
			setTimeout(initTimelineScroll, 100);
		}
	});

	// 如果使用SWUP，监听其事件
	if (typeof window.Swup !== "undefined") {
		// 监听 SWUP 开始过渡事件
		document.addEventListener("swup:transitionStart", () => {
			cleanupBoundElements();
		});

		// 监听 SWUP 内容替换事件
		document.addEventListener("swup:contentReplaced", () => {
			cleanupBoundElements();
			// 延迟初始化以确保DOM完全更新
			setTimeout(initTimelineScroll, 50);
		});

		// 监听 SWUP 页面视图事件
		document.addEventListener("swup:pageView", () => {
			cleanupBoundElements();
			setTimeout(initTimelineScroll, 100);
		});
	}

	// 增强对 Astro 导航的支持
	document.addEventListener("astro:page-load", () => {
		cleanupBoundElements();
		setTimeout(initTimelineScroll, 100);
	});

	document.addEventListener("astro:after-swap", () => {
		cleanupBoundElements();
		setTimeout(initTimelineScroll, 100);
	});

	// 暴露初始化函数到全局作用域，供其他脚本调用
	window.initTimelineScrollGlobal = initTimelineScroll;
	window.cleanupTimelineScroll = cleanupBoundElements;

	// 立即执行一次初始化，确保在脚本加载时就绑定事件
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initTimelineScroll);
	} else {
		// DOM 已经加载完成
		initTimelineScroll();
	}

	// 如果页面已经加载完成，立即初始化
	if (
		document.readyState === "complete" ||
		document.readyState === "interactive"
	) {
		setTimeout(initTimelineScroll, 10);
	}
})();
