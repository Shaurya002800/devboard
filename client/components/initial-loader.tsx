'use client'

import { useEffect, useState } from 'react'

export function InitialLoader() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) {
    return null
  }

  return (
    <div className="boot-loader">
      <div className="boot-loader__panel">
        <p className="boot-loader__label">DevBoard OS</p>
        <h1 className="boot-loader__title">
          Booting collaboration terminal...
        </h1>
        <div className="boot-loader__bar">
          <span className="boot-loader__bar-fill" />
        </div>
        <p className="boot-loader__hint">
          Loading projects, profiles, and application channels
        </p>
      </div>
    </div>
  )
}
