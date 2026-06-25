import { NextResponse } from 'next/server'

// Serves the Apple App Site Association file for Universal Links.
// The iOS app claims https://moto-booking-saas.vercel.app/dashboard/* so that
// dashboard links open the native app when installed.
export function GET() {
  const aasa = {
    applinks: {
      apps: [],
      details: [
        {
          appID: 'XQZAXVZNFK.com.williamlangdown.orla',
          paths: ['/dashboard/*'],
        },
      ],
    },
  }

  return new NextResponse(JSON.stringify(aasa), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=3600',
    },
  })
}
