(function (global) {
  const cacheKey = 'umami-share-cache';
  const cacheTTL = 3600_000; // 1h

  /**
   * ウェブサイト統計データの取得
   * @param {string} baseUrl - Umami Cloud APIのベースURL
   * @param {string} apiKey - APIキー
   * @param {string} websiteId - ウェブサイトID
   * @returns {Promise<object>} ウェブサイト統計データ
   */
  async function fetchWebsiteStats(baseUrl, apiKey, websiteId) {
    // キャッシュを確認
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < cacheTTL) {
          return parsed.value;
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }
    
    const currentTimestamp = Date.now();
    const statsUrl = `${baseUrl}/v1/websites/${websiteId}/stats?startAt=0&endAt=${currentTimestamp}`;
    
    const res = await fetch(statsUrl, {
      headers: {
        'x-umami-api-key': apiKey
      }
    });
    
    if (!res.ok) {
      throw new Error('ウェブサイト統計データの取得に失敗しました');
    }
    
    const stats = await res.json();
    
    // 結果をキャッシュ
    localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), value: stats }));
    
    return stats;
  }

  /**
   * 特定ページの統計データを取得
   * @param {string} baseUrl - Umami Cloud APIのベースURL
   * @param {string} apiKey - APIキー
   * @param {string} websiteId - ウェブサイトID
   * @param {string} urlPath - ページパス
   * @param {number} startAt - 開始タイムスタンプ
   * @param {number} endAt - 終了タイムスタンプ
   * @returns {Promise<object>} ページ統計データ
   */
  async function fetchPageStats(baseUrl, apiKey, websiteId, urlPath, startAt = 0, endAt = Date.now()) {
    const statsUrl = `${baseUrl}/v1/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}&url=${encodeURIComponent(urlPath)}`;
    
    const res = await fetch(statsUrl, {
      headers: {
        'x-umami-api-key': apiKey
      }
    });
    
    if (!res.ok) {
      throw new Error('ページ統計データの取得に失敗しました');
    }
    
    return await res.json();
  }

  /**
   * Umami ウェブサイト統計データを取得
   * @param {string} baseUrl - Umami Cloud APIのベースURL
   * @param {string} apiKey - APIキー
   * @param {string} websiteId - ウェブサイトID
   * @returns {Promise<object>} ウェブサイト統計データ
   */
  global.getUmamiWebsiteStats = async function (baseUrl, apiKey, websiteId) {
    try {
      return await fetchWebsiteStats(baseUrl, apiKey, websiteId);
    } catch (err) {
      throw new Error(`Umami統計データの取得に失敗しました: ${err.message}`);
    }
  };

  /**
   * 特定ページのUmami統計データを取得
   * @param {string} baseUrl - Umami Cloud APIのベースURL
   * @param {string} apiKey - APIキー
   * @param {string} websiteId - ウェブサイトID
   * @param {string} urlPath - ページパス
   * @param {number} startAt - 開始タイムスタンプ（オプション）
   * @param {number} endAt - 終了タイムスタンプ（オプション）
   * @returns {Promise<object>} ページ統計データ
   */
  global.getUmamiPageStats = async function (baseUrl, apiKey, websiteId, urlPath, startAt, endAt) {
    try {
      return await fetchPageStats(baseUrl, apiKey, websiteId, urlPath, startAt, endAt);
    } catch (err) {
      throw new Error(`获取Umami页面统计数据失败: ${err.message}`);
    }
  };

  global.clearUmamiShareCache = function () {
    localStorage.removeItem(cacheKey);
  };
})(window);