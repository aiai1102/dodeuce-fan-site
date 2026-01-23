import ReactGA from 'react-ga4';

const MEASUREMENT_ID = 'G-164YBH04FW';

/**
 * Google Analytics 4を初期化
 */
export const initGA = () => {
  ReactGA.initialize(MEASUREMENT_ID, {
    gtagOptions: {
      send_page_view: false, // 手動でページビューを送信するため無効化
    },
  });
};

/**
 * ページビューを送信
 */
export const trackPageView = (path: string, title?: string) => {
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title,
  });
};

/**
 * カスタムイベントを送信
 * @param category イベントカテゴリー（例: "User", "Navigation"）
 * @param action イベントアクション（例: "Click", "Submit"）
 * @param label イベントラベル（オプション）
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string
) => {
  ReactGA.event({
    category,
    action,
    label,
  });
};
