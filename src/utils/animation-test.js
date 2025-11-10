// アニメーションテストツール - yukinaスタイルのスライド効果を検証

export function testSlideAnimation() {
	console.log("Testing slide animation effects...");

	// メインアニメーション要素をテスト
	const mainElements = document.querySelectorAll(".transition-main");
	const animationElements = document.querySelectorAll(".onload-animation");

	console.log(`Found ${mainElements.length} main transition elements`);
	console.log(`Found ${animationElements.length} onload animation elements`);

	// CSSアニメーションプロパティを検査
	mainElements.forEach((el, index) => {
		const styles = window.getComputedStyle(el);
		console.log(`Element ${index}:`, {
			transition: styles.transition,
			transform: styles.transform,
			opacity: styles.opacity,
		});
	});

	return {
		mainElements: mainElements.length,
		animationElements: animationElements.length,
		status: "Animation test completed",
	};
}

// ページ遷移アニメーションをシミュレート
export function simulatePageTransition() {
	const body = document.body;
	const html = document.documentElement;

	// 離脱状態を追加
	html.classList.add("is-animating", "is-leaving");

	setTimeout(() => {
		// 離脱状態を除去し、進入状態を追加
		html.classList.remove("is-leaving");

		setTimeout(() => {
			// アニメーション完了
			html.classList.remove("is-animating");
			console.log("Page transition simulation completed");
		}, 300);
	}, 300);
}

// コンソールで利用可能なテスト関数
if (typeof window !== "undefined") {
	window.testSlideAnimation = testSlideAnimation;
	window.simulatePageTransition = simulatePageTransition;
}
