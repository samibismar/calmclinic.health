import { redirect } from "next/navigation";
import { getAllClinicSlugs } from "@/components/founder-demo/config/ClinicConfigs";

export default function FounderDemoIndexPage() {
  // For now, redirect to Fort Worth Eye demo
  // In the future, this could show a selection of available demos
  const clinicSlugs = getAllClinicSlugs();
  
  if (clinicSlugs.length > 0) {
    redirect(`/founder-demo/${clinicSlugs[0]}`);
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">CalmClinic Founder Demos</h1>
        <p className="text-xl text-gray-300">
          No demo configurations found. Please check back later.
        </p>
      </div>
    </div>
  );
}