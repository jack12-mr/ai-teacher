"use client"

import * as React from "react"

/**
 * Detects if running in iOS App environment (网页套壳)
 * Returns false during SSR and for: Android App, H5 browser, PC browser
 * Returns true only for: iOS App wrapper (WebView)
 */
export function useIsIOSApp() {
  const [isIOSApp, setIsIOSApp] = React.useState<boolean>(false)

  React.useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()

    // Check if iOS device
    const isIOS = /iphone|ipad|ipod/.test(ua)

    // Check if NOT Safari browser (distinguishes WebView from Safari)
    // Safari has "Safari" in UA, WebView typically doesn't
    const isNotSafari = !ua.includes('safari') || ua.includes('wkwebview')

    setIsIOSApp(isIOS && isNotSafari)
  }, [])

  return isIOSApp
}
