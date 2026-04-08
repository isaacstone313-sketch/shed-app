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

export default function Terms() {
  return (
    <div className="bg-white min-h-screen">
      <PolicyNav />
      <main className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold text-stone-900">Terms of Service</h1>
          <p className="text-stone-500 mt-3 text-sm">Last updated: April 2026</p>
        </div>

        <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Acceptance</h2>
            <p>
              By creating an account or using Shed, you agree to these terms. If you don't agree, don't use Shed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">What Shed is</h2>
            <p>
              Shed is a social music practice logger. It lets you log practice sessions, track your progress, and share your activity with other musicians. It is provided as-is, currently free of charge.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Your account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You must be 13 or older to use Shed.</li>
              <li>You're responsible for keeping your login credentials secure.</li>
              <li>You may only have one account. Don't impersonate other people or use a username that misleads others.</li>
              <li>We can suspend or delete accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Your content</h2>
            <p>
              You own the content you post to Shed — your session notes, photos, and comments. By posting, you grant Shed a non-exclusive, royalty-free license to display and store that content for the purpose of operating the service.
            </p>
            <p className="mt-3">
              You agree not to post content that is:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Illegal, threatening, or harassing.</li>
              <li>Someone else's private information without their consent.</li>
              <li>Spam, advertisements, or unrelated to music practice.</li>
              <li>Designed to harm, disrupt, or exploit the service or its users.</li>
            </ul>
            <p className="mt-3">
              We reserve the right to remove content that violates these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Attempt to access other users' accounts or data.</li>
              <li>Scrape, crawl, or bulk-download data from Shed.</li>
              <li>Reverse engineer the app or attempt to compromise its security.</li>
              <li>Use Shed for any purpose that violates applicable law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Availability</h2>
            <p>
              We aim for Shed to be available and reliable, but we make no guarantees about uptime. We may modify, pause, or discontinue the service at any time. We'll try to give reasonable notice for major changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">No warranty</h2>
            <p>
              Shed is provided "as is" without warranties of any kind. We don't guarantee that the service will be error-free, secure, or meet your specific requirements. Use it at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Shed and its creators are not liable for any indirect, incidental, or consequential damages arising from your use of the service — including loss of data or interruption of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Governing law</h2>
            <p>
              These terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Changes to these terms</h2>
            <p>
              We may update these terms. We'll post any changes here with a new date. Continued use of Shed after changes means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Contact</h2>
            <p>
              Questions about these terms? Email <span className="text-stone-800 font-medium">legal@shed.app</span>.
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
