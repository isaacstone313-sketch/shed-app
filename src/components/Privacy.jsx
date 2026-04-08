function PolicyNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="font-semibold text-stone-900 tracking-tight">Shed</a>
        <a href="/" className="text-sm text-stone-500 hover:text-stone-900 transition">← Back</a>
      </div>
    </nav>
  )
}

export default function Privacy() {
  return (
    <div className="bg-white min-h-screen">
      <PolicyNav />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-stone-900">Privacy Policy</h1>
          <p className="text-stone-500 mt-3 text-sm">Last updated: April 2026</p>
        </div>

        <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">The short version</h2>
            <p>
              Shed is a music practice logger. We collect the information you give us to make the app work. We don't sell your data. We don't run ads. We won't share your information with third parties except to operate the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">What we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-stone-800">Account information</strong> — your email address and the username you choose when you sign up.
              </li>
              <li>
                <strong className="text-stone-800">Practice session data</strong> — instrument, duration, session notes, mood, and any photos you attach to a session.
              </li>
              <li>
                <strong className="text-stone-800">Social activity</strong> — who you follow, which sessions you give kudos to, and comments you leave.
              </li>
              <li>
                <strong className="text-stone-800">Usage data</strong> — basic logs that Supabase (our database provider) collects as part of normal operations, such as timestamps and IP addresses.
              </li>
            </ul>
            <p className="mt-4">
              We do not collect payment information. Shed is currently free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To operate the app — show your sessions to people you're connected with, track your streaks, and run the feed.</li>
              <li>To send you notifications about activity on your account (kudos, comments, follows).</li>
              <li>To display aggregate, anonymized statistics on the landing page (total sessions logged, total hours practiced).</li>
              <li>To debug problems and improve the service.</li>
            </ul>
            <p className="mt-4">
              We do not use your data to train AI models, build advertising profiles, or sell to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Who can see your sessions</h2>
            <p>
              By default, your practice sessions are visible to anyone on Shed — it's a social feed. If you join a group, members of that group can also see your sessions. There is currently no private-mode option; all sessions are public within the app.
            </p>
            <p className="mt-3">
              Photos you attach to sessions are stored in a public bucket and accessible to anyone with the URL.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Third-party services</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-stone-800">Supabase</strong> — we use Supabase for our database, authentication, and file storage. Your data is stored on Supabase infrastructure. See <a href="https://supabase.com/privacy" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>.
              </li>
              <li>
                <strong className="text-stone-800">Spotify</strong> — if you optionally attach a Spotify track link to a session, we embed the Spotify player from open.spotify.com. This is optional and Spotify's privacy policy applies to that embed.
              </li>
              <li>
                <strong className="text-stone-800">Vercel</strong> — we deploy on Vercel, which handles web traffic. See <a href="https://vercel.com/legal/privacy-policy" className="text-amber-600 hover:underline" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Data retention and deletion</h2>
            <p>
              We keep your data as long as your account is active. If you want your account and all associated data deleted, email us at the address below and we'll remove it within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Cookies and tracking</h2>
            <p>
              Shed uses a session cookie set by Supabase Auth to keep you logged in. We do not use advertising cookies, tracking pixels, or third-party analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Children</h2>
            <p>
              Shed is not directed at children under 13. If you believe a child under 13 has created an account, contact us and we'll remove it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Changes to this policy</h2>
            <p>
              If we make material changes we'll update the date at the top of this page. Continued use of Shed after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Contact</h2>
            <p>
              Questions? Email us at <span className="text-stone-800 font-medium">privacy@shed.app</span>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-stone-200 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-sm text-stone-400">
          <span>© {new Date().getFullYear()} Shed</span>
          <div className="flex gap-5">
            <a href="/privacy" className="hover:text-stone-700 transition">Privacy</a>
            <a href="/terms" className="hover:text-stone-700 transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
