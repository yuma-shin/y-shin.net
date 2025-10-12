---
title: Fuwariでremark-link-cardを使用してリンクカードを実装する
published: 2025-03-02
description: "Fuwariでremark-link-cardを使用してリンクカードを実装してみました"
image: "./cover.webp"
tags: [remark-link-card, Astro, Fuwari]
category: "Web Site"
draft: false
lang: "ja"
---

FuwariではリンクカードはGithubのみの対応のため、その他のサイトもリンクカードとして表示させるカスタマイズを入れました。  
AstroではRemark Pluginが使用できるため、今回は定番のremark-link-cardを使用しました。

# remark-link-cardとは

​remark-link-cardは、Markdown内のテキストリンクをカード形式に変換するためのremarkプラグインです。

::github{repo="gladevise/remark-link-card"}

# インストール方法

1. `remark-link-card`をインストールする。

```powershell frame=none showLineNumbers=false
pnpm add remark-link-card
```

2. `astro.config.mjs`でremark-link-cardを定義します。

```js title="astro.config.mjs" ins={1, 4}
import remnarkLinkCard from 'remark-link-card'
{/* 中略 */}
remarkPlugins: [
      [remnarkLinkCard,{ shortenUrl: true }],
      remarkMath,
      remarkReadingTime,
      remarkExcerpt,
      remarkGithubAdmonitionsToDirectives,
      remarkDirective,
      remarkSectionize,
      parseDirectiveNode,
    ],
```

# 既存のスクリプトを編集する

1. `src/styles/markdown.css`でremark-link-cardのStyleを追記する。

```css title="markdown.css"
.rlc-container {
  width: 100%;
  max-width: 800px;
  max-height: 130px;
  margin: 0 auto 2rem;
  background: var(--license-block-bg);

  text-decoration: none;

  border-radius: 0.75rem;
  display: flex;
  align-items: stretch;
  flex-direction: row; /* デフォルトは横並び */

  transition:
    background 200ms ease-in-out 0s,
    box-shadow 200ms ease-in-out 0s;
}

.rlc-container:hover {
  background-color: var(--btn-regular-bg-hover);
}

.rlc-info {
  overflow: hidden; /* PCではhidden */
  padding: 1rem;
  text-align: left;
  flex: 4 1 100px;
  align-items: flex-start;
  text-decoration: none;
  min-height: 100px; /* スマホ時に高さ不足にならないように */
}

.rlc-title {
  font-size: 1.25rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

/* PCでは1行で「...」 */
.rlc-description {
  font-size: 0.875rem;
  font-weight: 300;
  display: -webkit-box;
  -webkit-line-clamp: 1; /* 1行で省略 */
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  line-height: 1.4rem; /* 行の高さを適切に調整 */
  max-height: 3rem;
  overflow: hidden;
  flex-grow: 1; /* 説明文が途切れないように */
  padding-bottom: 4px; /* PC時の圧迫を防ぐ */
  color: var(--tw-prose-body);
}

.rlc-url-container {
  margin-top: auto; /* 説明文の下に配置 */
  display: flex;
  align-items: center;
}

.rlc-favicon {
  margin-right: 4px;
  width: 16px;
  height: 16px;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.rlc-url {
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.rlc-image-container {
  position: relative;
  flex: 1 1 100px;
  padding: 0.3rem;
  aspect-ratio: 1 / 1;
}

.rlc-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-bottom-right-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* スマホ用のレイアウト調整 */
@media (max-width: 768px) {
  .rlc-container {
    flex-direction: column;
    max-height: unset;
  }

  /* 画像を上にする */
  .rlc-image-container {
    order: -1;
    flex: none;
    width: 100%;
    /*height: 150px;*/
    padding: 0.5rem;
    aspect-ratio: 1.91 / 1;
  }

  .rlc-image {
    width: 100%;
    height: 100%;
    border-radius: 0.75rem 0.75rem 0 0;
  }

  /* スマホではタイトル・説明・URLを折り返す */
  .rlc-title {
    white-space: normal;
    overflow: visible;
  }

  /* スマホでは全文表示 */
  .rlc-description {
    -webkit-line-clamp: unset; /* 制限解除 */
    -webkit-box-orient: unset;
    display: block;
    max-height: none;
    height: auto;
    overflow: visible;
    flex-grow: unset; /* スマホでは自由に伸ばす */
  }

  .rlc-info {
    overflow: visible; /* スマホではhiddenを解除 */
    min-height: unset; /* スマホでは高さ制限を解除 */
  }

  .rlc-url {
    white-space: normal;
    overflow-wrap: break-word;
  }
}
```

2. `src/components/misc/Markdown.astro`でリンクカードに対してTailwind CSS (prose)を適用させないようにする。  
   scriptタグの中に以下を追記する。

```javascript title="Markdown.astro"
let linkCards = Array.from(document.querySelectorAll(".rlc-container")) as HTMLElement[];
for (let linkCard of linkCards) {
    linkCard.classList.add("no-styling"); // Tailwind CSS(prose)を適用させないようにする
    linkCard.style.textDecoration = "none"; // 文字列の下線部を非表示にする
    linkCard.setAttribute('target','_blank'); //新しいタブで開く
}
```

# 参考にさせて頂いたありがたいサイト

https://sur33.com/posts/remark-link-card-with-astro/
