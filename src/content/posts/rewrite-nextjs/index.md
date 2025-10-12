---
title: 個人WEBをNext.js + Chakra UIで書き直しました
published: 2023-01-07
description: "あけましておめでとうございます！ HTMLでちょこちょこアップデートしてきた個人WEBサイトを、 勉強も兼ねてNext.jsとChakra UIで書き直しました。"
image: "./nextjs.webp"
tags: [ChakraUI, Next.js]
category: "Web Site"
draft: false
lang: "ja"
---

# はじめに

あけましておめでとうございます！
HTMLでちょこちょこアップデートしてきた個人WEBサイトを、
勉強も兼ねてNext.jsとChakra UIで書き直しました。
元々JavaScriptやTypeScriptに苦手意識があり、なかなか手を付けられなかったですが、
まあ、年も明けましたし帰省してもクソ暇なので暇つぶしがてら挑戦してみました。

# microCMS

これまでのサイトにブログページを新設しました。
ブログはほかのページよりも更新が多く、ページ自体も増えそうで管理が面倒だなと思っていたところにmicroCMSというAPIベースの日本製のヘッドレスCMSを見つけました。
これを使えばNext.js側は動的なページを1つ作っておくだけでOK。
記事を追加したいときはmicroCMSの管理画面からということで管理も楽で即採用しました。
webhookにも対応しているのもありがたいですね。

https://microcms.io/

# Chakra UI

React用のUIコンポーネントライブラリです。スタイルがコンポーネント化されていてUIに一貫性を持たせやすくしたライブラリになっています。今までCSSでゴリゴリ書いていたスタイルがタグ指定だけで実現できるのは驚きでした。

https://chakra-ui.com/

# Vercel

WEBホスティングサービスでは定番らしいです。Githubリポジトリと連携させて変更があれば自動でデプロイが走り常に最新状態のページが表示できるようになります。
自分はmicroCMSのwebhookとも連携させて、記事を追加した際にもデプロイが走るように設定しました。

https://vercel.com/

# おわりに

まだ、道半ばで使いこなせている感は全くないですが今後も勉強して少しずつサイトをアップデートできたらなと思います。

# 参考にさせて頂いたありがたい記事

https://qlitre-weblog.com/next-microcms-blog-w-chakra-matome

https://blog.microcms.io/microcms-next-jamstack-blog/
