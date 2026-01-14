import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for RemoteDesigners.co',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-3xl mx-auto px-8">
        <h1 className="text-4xl font-medium text-neutral-900 mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-neutral-500 mb-12">Last updated: January 15, 2026</p>

        <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)] space-y-8">
          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">1. Introduction</h2>
            <p className="text-neutral-600 leading-relaxed">
              RemoteDesigners.co (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">2. Information We Collect</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              We may collect the following types of information:
            </p>
            <ul className="list-disc list-inside text-neutral-600 space-y-2">
              <li><strong>Account Information:</strong> Email address and password when you create an account</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our Service, including pages visited, time spent, and features used</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and IP address</li>
              <li><strong>Cookies:</strong> Small data files stored on your device to enhance your experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-neutral-600 space-y-2">
              <li>Provide, maintain, and improve our Service</li>
              <li>Send you job alerts and newsletters (with your consent)</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Protect against fraudulent or unauthorized activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">4. Information Sharing</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside text-neutral-600 space-y-2">
              <li><strong>Service Providers:</strong> Third-party companies that help us operate our Service (e.g., hosting, analytics)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">5. Cookies and Tracking</h2>
            <p className="text-neutral-600 leading-relaxed">
              We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings. Disabling cookies may affect certain features of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">6. Data Security</h2>
            <p className="text-neutral-600 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">7. Data Retention</h2>
            <p className="text-neutral-600 leading-relaxed">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including to satisfy legal, accounting, or reporting requirements. You may request deletion of your account at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">8. Your Rights</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-neutral-600 space-y-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">9. Third-Party Links</h2>
            <p className="text-neutral-600 leading-relaxed">
              Our Service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-neutral-600 leading-relaxed">
              Our Service is not intended for individuals under the age of 16. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child, we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-neutral-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">12. Contact Us</h2>
            <p className="text-neutral-600 leading-relaxed">
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us at{' '}
              <a href="mailto:dcardinesiii@gmail.com" className="text-neutral-900 underline hover:no-underline">
                dcardinesiii@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
