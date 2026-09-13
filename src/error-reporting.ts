// content script / option page から background へエラーを転送するための共通処理
// content script は Notion ページの CSP / CORS の影響を受けるため、
// 外部送信は background (service worker) に集約する

export const ERROR_MESSAGE_TYPE = "notion-bar-colorize:error";

export type ErrorSource = "content" | "option" | "background";

export interface ErrorReport {
  type: typeof ERROR_MESSAGE_TYPE;
  source: ErrorSource;
  name: string;
  message: string;
  stack?: string;
  // 何をしている最中に起きたか（関数名など）。URL やページ内容は含めない
  operation?: string;
}

export const isErrorReport = (msg: unknown): msg is ErrorReport =>
  typeof msg === "object" &&
  msg !== null &&
  (msg as { type?: unknown }).type === ERROR_MESSAGE_TYPE;

export const serializeError = (
  source: ErrorSource,
  error: unknown,
  operation?: string
): ErrorReport => {
  if (error instanceof Error) {
    return {
      type: ERROR_MESSAGE_TYPE,
      source,
      name: error.name,
      message: error.message,
      stack: error.stack,
      operation,
    };
  }
  return {
    type: ERROR_MESSAGE_TYPE,
    source,
    name: "NonError",
    message: typeof error === "string" ? error : JSON.stringify(error),
    operation,
  };
};

// background に転送する。background が起動していない等で失敗しても握りつぶす
export const reportError = (
  source: ErrorSource,
  error: unknown,
  operation?: string
): void => {
  console.error(`[notion-bar-colorize] ${operation ?? source}:`, error);
  try {
    chrome.runtime.sendMessage(serializeError(source, error, operation)).catch(() => {});
  } catch {
    // 拡張がリロードされてコンテキストが無効化された場合など
  }
};

// 非同期関数を包み、例外を報告してから握りつぶす
export const withErrorReport = <T>(
  source: ErrorSource,
  operation: string,
  fn: () => Promise<T>
): Promise<T | undefined> =>
  fn().catch((e: unknown) => {
    reportError(source, e, operation);
    return undefined;
  });
