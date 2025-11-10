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
	 * 获取组件的内联样式
	 * @param component 组件配置
	 * @param index 组件在列表中的索引
	 */
	getComponentStyle(component: WidgetComponentConfig, index: number): string {
		const styles: string[] = [];

		// 添加自定义样式
		if (component.style) {
			styles.push(component.style);
		}

		// 添加动画延迟样式
		const animationDelay = this.getAnimationDelay(component, index);
		if (animationDelay > 0) {
			styles.push(`animation-delay: ${animationDelay}ms`);
		}

		return styles.join("; ");
	}

	/**
	 * 检查组件是否应该折叠
	 * @param component 组件配置
	 * @param itemCount 组件内容项数量
	 */
	isCollapsed(component: WidgetComponentConfig, itemCount: number): boolean {
		if (!component.responsive?.collapseThreshold) {
			return false;
		}
		return itemCount >= component.responsive.collapseThreshold;
	}

	/**
	 * 获取组件的路径
	 * @param componentType 组件类型
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
	 * 获取设备断点配置
	 */
	getBreakpoints() {
		return this.config.responsive.breakpoints;
	}

	/**
	 * 更新组件配置
	 * @param newConfig 新的配置
	 */
	updateConfig(newConfig: Partial<SidebarLayoutConfig>): void {
		this.config = { ...this.config, ...newConfig };
		this.enabledComponents = this.getEnabledComponents();
	}

	/**
	 * 添加新组件
	 * @param component 组件配置
	 */
	addComponent(component: WidgetComponentConfig): void {
		this.config.components.push(component);
		this.enabledComponents = this.getEnabledComponents();
	}

	/**
	 * 移除组件
	 * @param componentType 组件类型
	 */
	removeComponent(componentType: WidgetComponentType): void {
		this.config.components = this.config.components.filter(
			(component) => component.type !== componentType,
		);
		this.enabledComponents = this.getEnabledComponents();
	}

	/**
	 * 启用/禁用组件
	 * @param componentType 组件类型
	 * @param enable 是否启用
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
	 * 重新排序组件
	 * @param componentType 组件类型
	 * @param newOrder 新的排序值
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
	 * 检查组件是否应该在侧边栏中渲染
	 * @param componentType 组件类型
	 */
	isSidebarComponent(componentType: WidgetComponentType): boolean {
		// Pio 组件是全局组件，不在侧边栏中渲染
		return componentType !== "pio";
	}
}

/**
 * 默认组件管理器实例
 */
export const widgetManager = new WidgetManager();

/**
 * 工具函数：根据组件类型获取组件配置
 * @param componentType 组件类型
 */
export function getComponentConfig(
	componentType: WidgetComponentType,
): WidgetComponentConfig | undefined {
	return widgetManager
		.getConfig()
		.components.find((c) => c.type === componentType);
}

/**
 * 工具函数：检查组件是否启用
 * @param componentType 组件类型
 */
export function isComponentEnabled(
	componentType: WidgetComponentType,
): boolean {
	const config = getComponentConfig(componentType);
	return config?.enable ?? false;
}

/**
 * 工具函数：获取所有启用的组件类型
 */
export function getEnabledComponentTypes(): WidgetComponentType[] {
	const enabledComponents = widgetManager
		.getComponentsByPosition("top")
		.concat(widgetManager.getComponentsByPosition("sticky"));
	return enabledComponents.map((c) => c.type);
}
