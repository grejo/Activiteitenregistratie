'use client'

import { useEffect } from 'react'

export default function ImpersonationEnder({ logId }: { logId: string }) {
  useEffect(() => {
    const end = () => {
      fetch(`/api/admin/impersonation/${logId}`, {
        method: 'PATCH',
        keepalive: true,
      }).catch(() => {})
    }
    window.addEventListener('pagehide', end)
    return () => {
      window.removeEventListener('pagehide', end)
      end()
    }
  }, [logId])

  return null
}
