'use client'

import { useSyncExternalStore } from 'react'

export function useAuthToken() {
  const token = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const ready = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerReadySnapshot
  )

  return { token, ready }
}

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener)
  window.addEventListener('devboard-auth-change', listener)

  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener('devboard-auth-change', listener)
  }
}

function getSnapshot() {
  return window.sessionStorage.getItem('token')
}

function getServerSnapshot() {
  return null
}

function subscribeToHydration() {
  return () => {}
}

function getHydratedSnapshot() {
  return true
}

function getServerReadySnapshot() {
  return false
}
