// app/signup-unavailable/page.tsx
export default function SignupUnavailable() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">Signups Are Temporarily Closed</h1>
        <p className="text-lg text-gray-600">
          Thank you for your interest! We&#39;re not accepting new signups at this time. Please check back soon.
        </p>
      </div>
    </div>
  );
}