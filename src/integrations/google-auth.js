const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

let currentToken = ''
let currentProfile = null

export const isGoogleAuthConfigured = Boolean(clientId)

export function getGoogleIdToken() {
  return currentToken
}

export function getGoogleProfile() {
  return currentProfile
}

export function loadGoogleIdentity(onCredential) {
  if (!clientId) return Promise.resolve(false)
  if (window.google?.accounts?.id) {
    initializeGoogleIdentity(onCredential)
    return Promise.resolve(true)
  }
  return new Promise(resolve => {
    const existing = document.querySelector('script[data-google-identity]')
    const script = existing || document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => { initializeGoogleIdentity(onCredential); resolve(true) }
    script.onerror = () => resolve(false)
    if (!existing) document.head.appendChild(script)
  })
}

function initializeGoogleIdentity(onCredential) {
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: response => {
      currentToken = response.credential || ''
      try {
        const payload = JSON.parse(atob(currentToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
        currentProfile = { email: payload.email || '', name: payload.name || '' }
      } catch { currentProfile = null }
      onCredential?.(currentToken, currentProfile)
    },
  })
}

export function renderGoogleButton(element) {
  if (!clientId || !window.google?.accounts?.id || !element) return false
  window.google.accounts.id.renderButton(element, { theme: 'outline', size: 'large', text: 'signin_with', locale: 'ja' })
  return true
}

