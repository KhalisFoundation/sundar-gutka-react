// What counts as "the connection's fault" rather than ours.
//
// A pure predicate with no Firebase behind it, so anything can ask — including
// a test mocking `@common`, which is the reason it does not simply live inside
// the crashlytics wrapper that first needed it.
//
// It was written out by hand three separate times before this — in the database
// update check, in khalisRequest, and again for Crashlytics — and only two of
// the three agreed on which failures counted.
//
// The strings come from the platforms, not from us:
//   "Network request failed"  React Native's fetch, Android and iOS
//   "Failed to fetch"         Chromium, which the WebView paths surface
//   "Load failed"             WebKit/iOS
//   "Aborted" / timeouts      AbortController and our own request deadlines
//   Transport errors          what the native download engine and OkHttp
//                             surface mid-transfer on Android — a TLS record
//                             that failed to decrypt ("Read error: ssl=…"), a
//                             socket reset or aborted, a stream cut short, a
//                             host that would not resolve — and NSURLError's
//                             wording for the same things on iOS. Anchored at
//                             the start, like the first three, for the same
//                             reason.
const NETWORK_FAILURE = new RegExp(
  [
    "^(network request failed|failed to fetch|load failed)$",
    "timed out|timeout|aborted|network error",
    // Android: OkHttp / HttpURLConnection / BoringSSL
    "^(read|write) error: ssl=",
    "^failure in ssl library",
    "^ssl handshake",
    "^connection reset",
    "^connection refused",
    "^software caused connection abort",
    "^unexpected end of stream",
    "^unable to resolve host",
    "^network is unreachable",
    "^no address associated with hostname",
    "^socket (is )?closed",
    "^connection closed by peer",
    "^stream was reset",
    "^chain validation failed",
    "^trust anchor for certification path not found",
    // iOS: NSURLErrorDomain
    "^the internet connection appears to be offline",
    "^the network connection was lost",
    "^a server with the specified hostname could not be found",
    "^could not connect to the server",
    "^an ssl error has occurred",
    "^cancelled$",
  ].join("|"),
  "i"
);

// The same failures when they arrive as an errno-style code on the error
// object rather than in its text.
const NETWORK_FAILURE_CODES =
  /^(ECONNRESET|ECONNREFUSED|ECONNABORTED|ETIMEDOUT|ENETUNREACH|ENETDOWN|EHOSTUNREACH|ENOTFOUND|EAI_AGAIN|EPIPE)$/;

/**
 * True when `error` is a connection problem rather than a fault in the app.
 *
 * Give it the RAW caught value. A message the app composed around it — say
 * "getSevaConfig failed: Network request failed" — contains the platform's
 * words inside our own sentence, and matching that would be matching our
 * wording rather than the failure. The anchors above are deliberate.
 */
export const isNetworkFailure = (error) =>
  NETWORK_FAILURE_CODES.test(String(error?.code ?? "")) ||
  NETWORK_FAILURE.test(String(error?.message || error).trim());

export default isNetworkFailure;
