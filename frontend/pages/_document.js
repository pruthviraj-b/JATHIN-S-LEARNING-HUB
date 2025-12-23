import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#F8F9FB" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
