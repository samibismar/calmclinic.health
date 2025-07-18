// app/signup-unavailable/page.tsx
export default function SignupUnavailable() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Signups Are Temporarily Closed</h1>
        <p className="text-lg text-gray-600">
          To create an account, please contact us directly to get started.
        </p>
        <div className="mt-6 text-left">
          <h2 className="text-xl font-semibold mb-2">Interested in a Demo?</h2>
          <p className="mb-4 text-gray-600">Contact us to schedule a quick demo and learn more.</p>
          <ul className="text-gray-700">
            <li><strong>Call:</strong> 817-243-6226</li>
            <li><strong>Sami Bismar:</strong> sbismar2025@gmail.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
}