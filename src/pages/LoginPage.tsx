import { useState, type SubmitEvent } from "react"
import { login, type AdminUser } from "../api/auth"

type LoginPageProps = {
  onLoggedIn: (admin: AdminUser) => void
}

function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setLoading(true)
      setError(null)

      const admin = await login({
        email,
        password,
      })

      onLoggedIn(admin)
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : "Unable to login",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 text-zinc-900 dark:text-white">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            RallyLedger
          </h1>

          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to manage your tennis club.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-zinc-500"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2.5 font-medium hover:text-zinc-350 text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
