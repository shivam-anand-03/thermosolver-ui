import { useEffect, useState } from 'react'

const KEY = 'cfd-sidebar-collapsed'

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Desktop sidebar open/closed state, remembered across pages and reloads. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(read)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, collapsed ? '1' : '0')
    } catch {
      // storage blocked: the toggle still works for this session
    }
  }, [collapsed])
  return { collapsed, toggle: () => setCollapsed((c) => !c) }
}
