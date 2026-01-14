import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for RemoteDesigners.co',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-3xl mx-auto px-8">
        <h1 className="text-4xl font-medium text-neutral-900 mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-neutral-500 mb-12">Last updated: January 15, 2026</p>

        <div className="bg-white rounded-xl border border-neutral-200 p-8 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.03)] space-y-8">
          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-neutral-600 leading-relaxed">
              By accessing and using RemoteDesigners.co ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">2. Description of Service</h2>
            <p className="text-neutral-600 leading-relaxed">
              RemoteDesigners.co is a job board platform that aggregates and displays remote design job opportunities. We collect job listings from various sources across the internet and present them in a centralized location for job seekers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">3. User Accounts</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              To access certain features of the Service, you may need to create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-neutral-600 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">4. Job Listings</h2>
            <p className="text-neutral-600 leading-relaxed">
              Job listings displayed on RemoteDesigners.co are aggregated from third-party sources. We do not guarantee the accuracy, completeness, or availability of any job listing. We are not responsible for the hiring decisions of employers or the outcomes of job applications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">5. Prohibited Uses</h2>
            <p className="text-neutral-600 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-neutral-600 space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Scrape or collect data without permission</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Post false, misleading, or fraudulent content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">6. Intellectual Property</h2>
            <p className="text-neutral-600 leading-relaxed">
              The Service and its original content, features, and functionality are owned by RemoteDesigners.co and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-neutral-600 leading-relaxed">
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-neutral-600 leading-relaxed">
              In no event shall RemoteDesigners.co be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">9. Changes to Terms</h2>
            <p className="text-neutral-600 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-900 mb-4">10. Contact Us</h2>
            <p className="text-neutral-600 leading-relaxed">
              If you have any questions about these Terms, please contact us at{' '}
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
