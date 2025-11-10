import {
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
	WALLPAPER_BANNER,
} from "@constants/constants";
import { expressiveCodeConfig } from "@/config";
import type { LIGHT_DARK_MODE, WALLPAPER_MODE } from "@/types/config";

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	// 現在のテーマ状態の完全な情報を取得
	const currentIsDark = document.documentElement.classList.contains("dark");
	const currentTheme = document.documentElement.getAttribute("data-theme");

	// 目標テーマ状態を計算
	let targetIsDark: boolean = false; // デフォルト値を初期化
	switch (theme) {
		case LIGHT_MODE:
			targetIsDark = false;
			break;
		case DARK_MODE:
			targetIsDark = true;
			break;
		default:
			// デフォルトの場合、現在のテーマ状態を使用
			targetIsDark = currentIsDark;
			break;
	}

	// テーマ切り替えが本当に必要かを検出：
	// 1. darkクラスの状態が変更されるか
	// 2. expressiveCodeのテーマを更新する必要があるか
	const needsThemeChange = currentIsDark !== targetIsDark;
	const expectedTheme = targetIsDark ? "github-dark" : "github-light";
	const needsCodeThemeUpdate = currentTheme !== expectedTheme;

	// テーマ切り替えもコードテーマの更新も必要ない場合は直ちに戻る
	if (!needsThemeChange && !needsCodeThemeUpdate) {
		return;
	}

	// テーマ切り替えが必要な場合のみ遷移保護を追加
	if (needsThemeChange) {
		document.documentElement.classList.add("is-theme-transitioning");
	}

	// requestAnimationFrame を使用して次のフレームでの実行を保証し、ちらつきを防止
	requestAnimationFrame(() => {
		// テーマの変更を適用
		if (needsThemeChange) {
			if (targetIsDark) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		}

		// 現在のモードに基づいてExpressive Codeのテーマを設定
		const expressiveTheme = targetIsDark ? "github-dark" : "github-light";
		document.documentElement.setAttribute(
			"data-theme",
			expressiveTheme,
		);

		// コードブロックの強制再レンダリング - ホームからブログ記事へ移動時のレンダリング問題を解決
		if (needsCodeThemeUpdate) {
			// Expressive Codeの再レンダリングをトリガー
			setTimeout(() => {
				window.dispatchEvent(new CustomEvent('theme-change'));
			}, 0);
		}

		// 在下一帧快速移除保护类，使用微任务确保DOM更新完成
		if (needsThemeChange) {
			// 使用 requestAnimationFrame 确保在下一帧移除过渡保护类
			requestAnimationFrame(() => {
				document.documentElement.classList.remove("is-theme-transitioning");
			});
		}
	});
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem("theme", theme);
	applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}

export function getStoredWallpaperMode(): WALLPAPER_MODE {
	return (localStorage.getItem("wallpaperMode") as WALLPAPER_MODE) || WALLPAPER_BANNER;
}

export function setWallpaperMode(mode: WALLPAPER_MODE): void {
	localStorage.setItem("wallpaperMode", mode);
	// 触发自定义事件通知其他组件壁纸模式已改变
	window.dispatchEvent(new CustomEvent('wallpaper-mode-change', { detail: { mode } }));
}