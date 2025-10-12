---
title: FuwariでExpressive Codeを使用しコードブロックをカスタマイズする
published: 2025-03-02
description: "FuwariでExpressive Codeを使用しコードブロックをカスタマイズしてみました。"
image: "./cover.webp"
tags: [expressive-code, Astro, Fuwari]
category: "Web Site"
draft: false
lang: "ja"
---

:::warning
2025-06-07  
[#476](https://github.com/saicaca/fuwari/pull/476)でExpressive Codeが公式サポートされ、
最新のfuwariテンプレートではこの手順は不要となりました。
:::

FuwariのデフォルトコードブロックはLanguageやファイル名を表示できないため、`astro-expressive-code`を利用してカスタマイズしてみました。

# Expressive Codeとは

Expressive Code は、開発者がコードスニペットを美しく、分かりやすく表示できるようにするためのライブラリです。Markdownベースのドキュメント、ブログ、技術記事などで、コードの見た目を改善するために活用されます。

このライブラリは プラグインベースの設計 になっており、カスタマイズ性が高いのが特徴です。

https://expressive-code.com/

# インストール方法

1. 以下のコマンドで`astro-expressive-code`と`@expressive-code/plugin-line-numbers`をインストールする

```powershell frame="none" showLineNumbers=false
pnpm add astro-expressive-code @expressive-code/plugin-line-numbers
```

2. `astro.config.mjs`で定義する

```javascript title="astro.config.mjs" ins={1-2, 45-48}　collapse={5-35, 51-107}
import expressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import remnarkLinkCard from "remark-link-card";

// https://astro.build/config
export default defineConfig({
  site: "https://www.y-shin.net/",
  base: "/",
  trailingSlash: "always",
  integrations: [
    tailwind({
      nesting: true,
    }),
    swup({
      theme: false,
      animationClass: "transition-swup-", // see https://swup.js.org/options/#animationselector
      // the default value `transition-` cause transition delay
      // when the Tailwind class `transition-all` is used
      containers: ["main", "#toc"],
      smoothScrolling: true,
      cache: true,
      preload: true,
      accessibility: true,
      updateHead: true,
      updateBodyClass: false,
      globalInstance: true,
    }),
    icon({
      include: {
        "preprocess: vitePreprocess(),": ["*"],
        "fa6-brands": ["*"],
        "fa6-regular": ["*"],
        "fa6-solid": ["*"],
      },
    }),
    svelte(),
    sitemap(),
    Compress({
      CSS: false,
      Image: false,
      Action: {
        Passed: async () => true, // https://github.com/PlayForm/Compress/issues/376
      },
    }),
    expressiveCode({
      themes: ["aurora-x"],
      plugins: [pluginLineNumbers()],
    }),
  ],
  markdown: {
    remarkPlugins: [[remnarkLinkCard, { shortenUrl: true, cache: true }], remarkMath, remarkReadingTime, remarkExcerpt, remarkGithubAdmonitionsToDirectives, remarkDirective, remarkSectionize, parseDirectiveNode],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypeComponents,
        {
          components: {
            github: GithubCardComponent,
            linkcard: LinkCardComponent,
            note: (x, y) => AdmonitionComponent(x, y, "note"),
            tip: (x, y) => AdmonitionComponent(x, y, "tip"),
            important: (x, y) => AdmonitionComponent(x, y, "important"),
            caution: (x, y) => AdmonitionComponent(x, y, "caution"),
            warning: (x, y) => AdmonitionComponent(x, y, "warning"),
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["anchor"],
          },
          content: {
            type: "element",
            tagName: "span",
            properties: {
              className: ["anchor-icon"],
              "data-pagefind-ignore": true,
            },
            children: [
              {
                type: "text",
                value: "#",
              },
            ],
          },
        },
      ],
    ],
  },
  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // temporarily suppress this warning
          if (warning.message.includes("is dynamically imported by") && warning.message.includes("but also statically imported by")) {
            return;
          }
          warn(warning);
        },
      },
    },
  },
});
```

# 既存スクリプトの編集

1. `src/layouts/Layout.astro`で`preElements`を削除する

```javascript title="Laayout.astro" del={20-30}
function initCustomScrollbar() {
	const bodyElement = document.querySelector('body');
	if (!bodyElement) return;
	OverlayScrollbars(
		// docs say that a initialization to the body element would affect native functionality like window.scrollTo
		// but just leave it here for now
		{
			target: bodyElement,
			cancel: {
				nativeScrollbarsOverlaid: true,    // don't initialize the overlay scrollbar if there is a native one
			}
		}, {
		scrollbars: {
			theme: 'scrollbar-base scrollbar-auto py-1',
			autoHide: 'move',
			autoHideDelay: 500,
			autoHideSuspend: false,
		},
	});
	const preElements = document.querySelectorAll('pre');
	preElements.forEach((ele) => {
		OverlayScrollbars(ele, {
			scrollbars: {
				theme: 'scrollbar-base scrollbar-dark px-2',
				autoHide: 'leave',
				autoHideDelay: 500,
				autoHideSuspend: false
			}
		});
	});
	const katexElements = document.querySelectorAll('.katex-display') as NodeListOf<HTMLElement>;
	katexElements.forEach((ele) => {
		OverlayScrollbars(ele, {
			scrollbars: {
				theme: 'scrollbar-base scrollbar-auto py-1',
			}
		});
	});
}
```

2. `src/component/misc/Markdown.astro`を編集し、コピーボタンのスクリプトを削除する。

```javascript title="Markdown.astro" del={25-75}
---
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/jetbrains-mono/wght-italic.css'

interface Props {
  class: string
}
const className = Astro.props.class
---
<div data-pagefind-body class=`prose dark:prose-invert prose-base !max-w-none custom-md ${className}`>
    <!--<div class="prose dark:prose-invert max-w-none custom-md">-->
    <!--<div class="max-w-none custom-md">-->
    <slot/>
</div>

<script>
    let linkCards = Array.from(document.querySelectorAll(".rlc-container")) as HTMLElement[];
    for (let linkCard of linkCards) {
        linkCard.classList.add("no-styling");
        linkCard.style.textDecoration = "none";
        linkCard.setAttribute('target','_blank');
    }
</script>

<script>
  const observer = new MutationObserver(addPreCopyButton);
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("DOMContentLoaded", addPreCopyButton);

  function addPreCopyButton() {
    observer.disconnect();

    let codeBlocks = Array.from(document.querySelectorAll("pre"));

    for (let codeBlock of codeBlocks) {
      if (codeBlock.parentElement?.nodeName === "DIV" && codeBlock.parentElement?.classList.contains("code-block")) continue

      let wrapper = document.createElement("div");
      wrapper.className = "relative code-block";

      let copyButton = document.createElement("button");
      copyButton.className = "copy-btn btn-regular-dark absolute active:scale-90 h-8 w-8 top-2 right-2 opacity-75 text-sm p-1.5 rounded-lg transition-all ease-in-out";

      codeBlock.setAttribute("tabindex", "0");
      if (codeBlock.parentNode) {
        codeBlock.parentNode.insertBefore(wrapper, codeBlock);
      }

      let copyIcon = `<svg class="copy-btn-icon copy-icon" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M368.37-237.37q-34.48 0-58.74-24.26-24.26-24.26-24.26-58.74v-474.26q0-34.48 24.26-58.74 24.26-24.26 58.74-24.26h378.26q34.48 0 58.74 24.26 24.26 24.26 24.26 58.74v474.26q0 34.48-24.26 58.74-24.26 24.26-58.74 24.26H368.37Zm0-83h378.26v-474.26H368.37v474.26Zm-155 238q-34.48 0-58.74-24.26-24.26-24.26-24.26-58.74v-515.76q0-17.45 11.96-29.48 11.97-12.02 29.33-12.02t29.54 12.02q12.17 12.03 12.17 29.48v515.76h419.76q17.45 0 29.48 11.96 12.02 11.97 12.02 29.33t-12.02 29.54q-12.03 12.17-29.48 12.17H213.37Zm155-238v-474.26 474.26Z"/></svg>`
      let successIcon = `<svg class="copy-btn-icon success-icon" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="m389-377.13 294.7-294.7q12.58-12.67 29.52-12.67 16.93 0 29.61 12.67 12.67 12.68 12.67 29.53 0 16.86-12.28 29.14L419.07-288.41q-12.59 12.67-29.52 12.67-16.94 0-29.62-12.67L217.41-430.93q-12.67-12.68-12.79-29.45-.12-16.77 12.55-29.45 12.68-12.67 29.62-12.67 16.93 0 29.28 12.67L389-377.13Z"/></svg>`
      copyButton.innerHTML = `<div>${copyIcon} ${successIcon}</div>
      `

      wrapper.appendChild(codeBlock);
      wrapper.appendChild(copyButton);

      let timeout: ReturnType<typeof setTimeout>;
      copyButton.addEventListener("click", async () => {
        if (timeout) {
            clearTimeout(timeout);
        }
        let text = codeBlock?.querySelector("code")?.innerText;
        if (text === undefined) return;
        await navigator.clipboard.writeText(text);
        copyButton.classList.add("success");
        timeout = setTimeout(() => {
          copyButton.classList.remove("success");
        }, 1000);
      });
    }

    observer.observe(document.body, { childList: true, subtree: true });
  }
</script>

```
