import { notFound } from "next/navigation";
import { getClinicConfig, getAllClinicSlugs } from "@/components/founder-demo/config/ClinicConfigs";
import FounderDemoLayout from "@/components/founder-demo/FounderDemoLayout";

interface PageProps {
  params: Promise<{
    clinic: string;
  }>;
}

// Generate static params for known clinics
export async function generateStaticParams() {
  const clinicSlugs = getAllClinicSlugs();
  
  return clinicSlugs.map((clinic) => ({
    clinic,
  }));
}

// Generate metadata for each clinic
export async function generateMetadata({ params }: PageProps) {
  try {
    const resolvedParams = await params;
    const clinic = getClinicConfig(resolvedParams.clinic);
    
    return {
      title: `CalmClinic Demo - ${clinic.practice_name}`,
      description: `Experience how CalmClinic transforms patient care at ${clinic.practice_name}. A founder's story about building AI-powered healthcare solutions.`,
      openGraph: {
        title: `CalmClinic Demo - ${clinic.practice_name}`,
        description: `See how Dr. ${clinic.doctor_name} could transform patient experiences with AI-powered assistance.`,
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'CalmClinic Founder Demo',
      description: 'Experience the future of AI-powered patient care',
    };
  }
}

export default async function FounderDemoPage({ params }: PageProps) {
  let clinic;
  
  try {
    const resolvedParams = await params;
    clinic = getClinicConfig(resolvedParams.clinic);
  } catch {
    notFound();
  }

  return <FounderDemoLayout clinic={clinic} />;
}