# Creght Auth Usage

Creght has project-scoped platform auth for site visitors. Use the browser-side
`talizen/auth` SDK for registration, password login, logout, current-user state,
OAuth/social login, and protected UI flows.

Do not build auth with Func or JSON tables. Do not store passwords, session
tokens, OAuth tokens, OAuth callback state, or project auth identities in custom
tables.

## Client SDK

Use `talizen/auth` from browser page or component code:

```ts
import {
  currentUser,
  listAuthProviders,
  login,
  loginWithOAuth,
  logout,
  register,
  requireUser,
  type AuthUser,
} from "talizen/auth"
```

Available helpers:

- `register(input)` creates a project auth user and signs them in.
- `login({ account, password })` signs in with the project auth cookie.
- `logout()` clears the current project auth session.
- `currentUser()` returns the signed-in user or `null`.
- `requireUser()` returns the signed-in user or throws `TalizenAuthError`.
- `listAuthProviders()` returns enabled OAuth providers configured for the
  project.
- `loginWithOAuth(provider, { redirectUrl })` redirects the browser to provider
  login.
- `getOAuthLoginUrl(provider, { redirectUrl })` returns a provider login URL
  for custom redirect flows.

## Password Login

`account` is the login identifier. It does not have to be an email address.
Only use an email as `account` when the user intentionally signs in with their
email.

```tsx
import { useState, type FormEvent } from "react"
import { currentUser, login, logout, type AuthUser } from "talizen/auth"

export default function LoginPanel() {
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [message, setMessage] = useState("")

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage("")
    try {
      const nextUser = await login({ account, password })
      setUser(nextUser)
    } catch {
      setMessage("Unable to sign in.")
    }
  }

  async function refreshUser() {
    setUser(await currentUser())
  }

  async function signOut() {
    await logout()
    setUser(null)
  }

  return (
    <section>
      {user ? (
        <div>
          <p>Signed in as {user.name || user.account || user.email}</p>
          <button type="button" onClick={signOut}>Sign out</button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <input value={account} onChange={(event) => setAccount(event.target.value)} />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="submit">Sign in</button>
        </form>
      )}
      <button type="button" onClick={refreshUser}>Refresh session</button>
      {message ? <p>{message}</p> : null}
    </section>
  )
}
```

## Registration

Registration requires `account` and `password`. `email`, `phone`, `name`,
`avatar`, and `profile` are optional profile fields.

```tsx
import { register } from "talizen/auth"

await register({
  account: "alice",
  password: "secret",
  name: "Alice",
  email: "alice@example.com",
  profile: { plan: "free" },
})
```

## OAuth Login

OAuth providers are configured in the project Auth settings. Page code should
not hard-code client secrets, token endpoints, or callback logic.

```tsx
import { useEffect, useState } from "react"
import { listAuthProviders, loginWithOAuth, type AuthProvider } from "talizen/auth"

export function OAuthButtons() {
  const [providers, setProviders] = useState<AuthProvider[]>([])

  useEffect(() => {
    listAuthProviders().then(setProviders).catch(() => setProviders([]))
  }, [])

  return (
    <div>
      {providers.map((provider) => (
        <button
          key={provider.key}
          type="button"
          onClick={() => loginWithOAuth(provider.key, { redirectUrl: "/account" })}
        >
          Continue with {provider.name}
        </button>
      ))}
    </div>
  )
}
```

`redirectUrl` must be a same-site relative path such as `/account`. The platform
generates OAuth state, performs callback token exchange, creates or updates the
project auth user, sets the auth cookie, then redirects back to that path.

## Protected UI

For browser-rendered protected UI, load the current user first and render a
login prompt when absent:

```tsx
import { useEffect, useState } from "react"
import { currentUser, type AuthUser } from "talizen/auth"

export function AccountPage() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)

  useEffect(() => {
    currentUser().then(setUser).catch(() => setUser(null))
  }, [])

  if (user === undefined) return <p>Loading...</p>
  if (!user) return <a href="/login">Sign in</a>

  return <p>Welcome, {user.name || user.account || user.email}</p>
}
```

For protected backend actions, use Func only for the business action and read
the signed-in user inside Func with `ctx.auth.requireUser()`. Func auth is only
for reading the current project user inside backend business code; do not
implement login, registration, logout, or OAuth in Func.

## API Shape

The SDK calls same-site platform endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `PUT /auth/me/profile`
- `GET /auth/provider_list`
- `GET /auth/oauth/login_url?provider=...&redirect_url=...`
- `GET /auth/oauth/callback/:provider`

Use the SDK instead of calling these endpoints directly unless a low-level
integration specifically requires it.
