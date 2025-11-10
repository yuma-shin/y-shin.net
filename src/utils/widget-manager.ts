import { sidebarLayoutConfig } from "../config";
import type {
	SidebarLayoutConfig,
	WidgetComponentConfig,
	WidgetComponentType,
} from "../types/config";

/**
 * コンポーネントマッピング表 - コンポーネントタイプを実際のコンポーネントパスにマッピング
 */
export const WIDGET_COMPONENT_MAP = {
	profile: "../components/widget/Profile.astro",
	announcement: "../components/widget/Announcement.astro",
	categories: "../components/widget/Categories.astro",
	tags: "../components/widget/Tags.astro",
	toc: "../components/widget/TOC.astro",
	"music-player": "../components/widget/MusicPlayer.svelte",
	//pio: "../components/widget/Pio.astro", // Pio コンポーネントのマッピングを追加
	custom: null, // カスタムコンポーネントは設定でパスを指定する必要がある
} as const;

/**
 * コンポーネントマネージャークラス
 * サイドバーコンポーネントの動的ロード、ソート、レンダリングを管理
 */
export class WidgetManager {
	private config: SidebarLayoutConfig;
	private enabledComponents: WidgetComponentConfig[];

	constructor(config: SidebarLayoutConfig = sidebarLayoutConfig) {
		this.config = config;
		this.enabledComponents = this.getEnabledComponents();
	}

	/**
	 * 設定を取得
	 */
	getConfig(): SidebarLayoutConfig {
		return this.config;
	}

	/**
	 * 有効化されたコンポーネントリストを取得
	 */
	private getEnabledComponents(): WidgetComponentConfig[] {
		return this.config.components
			.filter((component) => component.enable)
			.sort((a, b) => a.order - b.order);
	}

	/**
	 * 位置に基づいてコンポーネントリストを取得
	 * @param position コンポーネント位置：'top' | 'sticky'
	 */
	getComponentsByPosition(position: "top" | "sticky"): WidgetComponentConfig[] {
		return this.enabledComponents.filter(
			(component) => component.position === position,
		);
	}

	/**
	 * コンポーネントのアニメーション遅延時間を取得
	 * @param component コンポーネント設定
	 * @param index リスト内のコンポーネントのインデックス
	 */
	getAnimationDelay(component: WidgetComponentConfig, index: number): number {
		if (component.animationDelay !== undefined) {
			return component.animationDelay;
		}

		if (this.config.defaultAnimation.enable) {
			return (
				this.config.defaultAnimation.baseDelay +
				index * this.config.defaultAnimation.increment
			);
		}

		return 0;
	}

	/**
	 * コンポーネントのCSSクラス名を取得
	 * @param component コンポーネント設定
	 * @param index リスト内のコンポーネントのインデックス
	 */
	getComponentClass(component: WidgetComponentConfig, _index: number): string {
		const classes: string[] = [];

		// 基本クラス名を追加
		if (component.class) {
			classes.push(component.class);
		}

		// レスポンシブ用の非表示クラス名を追加
		if (component.responsive?.hidden) {
			component.responsive.hidden.forEach((device) => {
				switch (device) {
					case "mobile":
						classes.push("hidden", "md:block");
						break;
					case "tablet":
						classes.push("md:hidden", "lg:block");
						break;
					case "desktop":
						classes.push("lg:hidden");
						break;
				}
			});
		}

		return classes.join(" ");
	}

	/**
	 * コンポーネントのインラインスタイルを取得
	 * @param component コンポーネント設定
	 * @param index コンポーネントリスト内のインデックス
	 */
	getComponentStyle(component: WidgetComponentConfig, index: number): string {
		const styles: string[] = [];

		// カスタムスタイルを追加
		if (component.style) {
			styles.push(component.style);
		}

		// アニメーション遅延スタイルを追加
		const animationDelay = this.getAnimationDelay(component, index);
		if (animationDelay > 0) {
			styles.push(`animation-delay: ${animationDelay}ms`);
		}

		return styles.join("; ");
	}

	/**
	 * コンポーネントを折りたたむべきかを確認
	 * @param component コンポーネント設定
	 * @param itemCount コンポーネント内のアイテム数
	 */
	isCollapsed(component: WidgetComponentConfig, itemCount: number): boolean {
		if (!component.responsive?.collapseThreshold) {
			return false;
		}
		return itemCount >= component.responsive.collapseThreshold;
	}

	/**
	 * コンポーネントのパスを取得
	 * @param componentType コンポーネントタイプ
	 */
	getComponentPath(componentType: WidgetComponentType): string | null {
		return WIDGET_COMPONENT_MAP[componentType];
	}

	/**
	 * 检查当前设备是否应该显示侧边栏
	 * @param deviceType 设备类型
	 */
	shouldShowSidebar(deviceType: "mobile" | "tablet" | "desktop"): boolean {
		if (!this.config.enable) {
			return false;
		}

		const layoutMode = this.config.responsive.layout[deviceType];
		return layoutMode === "sidebar";
	}

	/**
	 * デバイスのブレークポイント設定を取得
	 */
	getBreakpoints() {
		return this.config.responsive.breakpoints;
	}

	/**
	 * 設定を更新
	 * @param newConfig 新しい設定
	 */
	updateConfig(newConfig: Partial<SidebarLayoutConfig>): void {
		this.config = { ...this.config, ...newConfig };
		this.enabledComponents = this.getEnabledComponents();
	}

	/**
	 * コンポーネントを追加
	 * @param component コンポーネント設定
	 */
	addComponent(component: WidgetComponentConfig): void {
		this.config.components.push(component);
		this.enabledComponents = this.getEnabledComponents();
	}

	/**
	 * コンポーネントを削除
	 * @param componentType コンポーネントタイプ
	 */
	removeComponent(componentType: WidgetComponentType): void {
		this.config.components = this.config.components.filter(
			(component) => component.type !== componentType,
		);
		this.enabledComponents = this.getEnabledComponents();
	}

	/**
	 * コンポーネントの有効化/無効化
	 * @param componentType コンポーネントタイプ
	 * @param enable 有効にするかどうか
	 */
	toggleComponent(componentType: WidgetComponentType, enable: boolean): void {
		const component = this.config.components.find(
			(c) => c.type === componentType,
		);
		if (component) {
			component.enable = enable;
			this.enabledComponents = this.getEnabledComponents();
		}
	}

	/**
	 * コンポーネントの並び順を変更
	 * @param componentType コンポーネントタイプ
	 * @param newOrder 新しい順序値
	 */
	reorderComponent(componentType: WidgetComponentType, newOrder: number): void {
		const component = this.config.components.find(
			(c) => c.type === componentType,
		);
		if (component) {
			component.order = newOrder;
			this.enabledComponents = this.getEnabledComponents();
		}
	}

	/**
	 * コンポーネントをサイドバーに描画すべきかを確認
	 * @param componentType コンポーネントタイプ
	 */
	isSidebarComponent(componentType: WidgetComponentType): boolean {
		// Pioコンポーネントはグローバルコンポーネントのため、サイドバーには描画しない
		return componentType !== "pio";
	}
}

/**
 * デフォルトのコンポーネントマネージャーインスタンス
 */
export const widgetManager = new WidgetManager();

/**
 * ユーティリティ関数：コンポーネントタイプに基づいて設定を取得
 * @param componentType コンポーネントタイプ
 */
export function getComponentConfig(
	componentType: WidgetComponentType,
): WidgetComponentConfig | undefined {
	return widgetManager
		.getConfig()
		.components.find((c) => c.type === componentType);
}

/**
 * ユーティリティ関数：コンポーネントが有効かどうかを確認
 * @param componentType コンポーネントタイプ
 */
export function isComponentEnabled(
	componentType: WidgetComponentType,
): boolean {
	const config = getComponentConfig(componentType);
	return config?.enable ?? false;
}

/**
 * ユーティリティ関数：有効化されている全コンポーネントタイプを取得
 */
export function getEnabledComponentTypes(): WidgetComponentType[] {
	const enabledComponents = widgetManager
		.getComponentsByPosition("top")
		.concat(widgetManager.getComponentsByPosition("sticky"));
	return enabledComponents.map((c) => c.type);
}
