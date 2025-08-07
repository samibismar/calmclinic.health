import { Metadata } from 'next'
import { MessageCircle, Shield, Clock, CheckCircle, MessageSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'SMS Assistant Opt-In | CalmClinic',
  description: 'Opt-in to receive helpful SMS messages from your CalmClinic AI assistant.',
}

export default function SmsOptInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-2xl">
              <MessageCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CalmClinic SMS Assistant Opt-In Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with your healthcare team through our secure SMS assistant service
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* How to Opt In Section */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-2 rounded-lg mr-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">How to Opt In</h2>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                <strong>Text our toll-free number</strong> displayed at your clinic to begin receiving helpful SMS messages from CalmClinic. 
                This number appears on printed materials, signage, and your clinic&apos;s website. Simply send any message to get started.
              </p>
            </div>
          </div>

          {/* What You'll Receive Section */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="bg-cyan-100 p-2 rounded-lg mr-4">
                <Clock className="h-6 w-6 text-cyan-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">What You&apos;ll Receive</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Visit preparation instructions and guidance</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Answers to common questions about your care</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Insurance and payment explanations</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Optionally, post-visit reminders or care summaries</span>
                </div>
              </div>
            </div>
          </div>

          {/* Consent Section */}
          <div className="mb-10">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-2 rounded-lg mr-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Your Consent & Privacy</h2>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>By texting our toll-free number, you consent to receive informational SMS messages from CalmClinic.</strong> 
                These messages are designed to help you prepare for your appointment and understand your care.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Message and data rates may apply.</strong> The frequency of messages varies based on your upcoming appointments and questions you ask.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>You can opt out at any time</strong> by replying <span className="bg-gray-100 px-2 py-1 rounded font-mono">STOP</span> to any message. 
                For help, reply <span className="bg-gray-100 px-2 py-1 rounded font-mono">HELP</span>.
              </p>
            </div>
          </div>

          {/* Security & Compliance */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security & Compliance</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• All communications are encrypted and HIPAA-compliant</p>
              <p>• Personal health information is protected according to federal privacy laws</p>
              <p>• SMS messages are for informational purposes and do not replace emergency care</p>
              <p>• For medical emergencies, always call 911 or visit your nearest emergency room</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg mb-6">
              Look for the CalmClinic toll-free number at your healthcare provider&apos;s office, 
              or ask your care team for the SMS assistant number.
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
              <p className="text-sm">
                Simply text the number to begin receiving helpful health information and appointment guidance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} CalmClinic. All rights reserved.</p>
          <p className="mt-2">
            Questions about this policy? Contact your healthcare provider or visit{' '}
            <a href="https://calmclinic.health" className="text-blue-600 hover:text-blue-800 underline">
              calmclinic.health
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}