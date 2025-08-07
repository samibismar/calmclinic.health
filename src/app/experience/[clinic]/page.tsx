import { Suspense } from "react";
import DynamicExperienceWrapper from './dynamic-experience-wrapper';

export const dynamic = 'force-dynamic';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-blue-500 rounded-full shadow-lg animate-pulse flex items-center justify-center">
          <div className="w-10 h-10 bg-white/30 rounded-full animate-pulse"></div>
        </div>
        <p className="text-blue-700 text-lg font-medium">Preparing your experience...</p>
      </div>
    </div>
  );
}

interface ExperiencePageProps {
  params: Promise<{
    clinic: string;
  }>;
}

export default async function ExperiencePage({ params }: ExperiencePageProps) {
  const { clinic } = await params;
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DynamicExperienceWrapper clinicSlug={clinic} />
    </Suspense>
  );
}