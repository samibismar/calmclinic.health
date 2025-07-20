"use client";

import { useState } from "react";

const TEMPLATES = [
  'general',
  'urgent-care', 
  'specialist',
  'dental',
  'mental-health',
  'pediatric',
  'custom'
];

const SAMPLE_INTERVIEW_RESPONSES = {
  communicationStyle: "Warm and personal, focusing on making patients feel heard and comfortable",
  anxietyHandling: "We take extra time to explain procedures and always validate patient concerns",
  practiceUniqueness: "We focus on holistic care and spend more time with each patient than typical practices",
  medicalDetailLevel: "We explain things in simple terms but provide detailed information when patients ask",
  escalationPreference: "Any medical questions, complex scheduling issues, or when patients seem frustrated",
  culturalApproach: "We welcome patients from all backgrounds and have Spanish-speaking staff",
  formalityLevel: "Professional but warm and approachable"
};

const SAMPLE_CLINIC_DATA = {
  practice_name: "Sunshine Family Medicine",
  doctor_name: "Dr. Sarah Johnson",
  specialty: "Family Medicine"
};

export default function PromptGeneratorDebugPage() {
  const [template, setTemplate] = useState('general');
  const [customInstructions, setCustomInstructions] = useState('');
  const [interviewResponses, setInterviewResponses] = useState(JSON.stringify(SAMPLE_INTERVIEW_RESPONSES, null, 2));
  const [clinicData, setClinicData] = useState(JSON.stringify(SAMPLE_CLINIC_DATA, null, 2));
  
  // These are the actual prompts sent to OpenAI - make them editable
  const [systemPrompt, setSystemPrompt] = useState(
    `You are an expert in crafting system prompts for AI assistants in healthcare clinics. Create a comprehensive system prompt that captures this clinic's approach and communication style.`
  );
  
  const [userPromptTemplate, setUserPromptTemplate] = useState(
    `You are an expert in crafting system prompts for AI assistants in healthcare clinics. Create a comprehensive system prompt that captures this clinic's approach and communication style.

CLINIC INFORMATION:
Practice Name: {clinic.practice_name}
Primary Doctor: {clinic.doctor_name}
Specialty: {clinic.specialty}

INTERVIEW RESPONSES (Q&A):
{interviewResponses}

Use the above interview answers as context and guidance when generating the system prompt. Do not repeat the questions verbatim, but use the information to shape the assistant's personality, boundaries, and behavior.

SELECTED TEMPLATE: {templateDescription}
ADDITIONAL INSTRUCTIONS: {custom_instructions}

CRITICAL REQUIREMENTS:
This system prompt will be combined with dynamic tool instructions and real-time data access. Focus ONLY on:
- Communication personality and conversational style
- Patient interaction approach and tone
- Practice philosophy and core values
- Professional boundaries and ethical guidelines
- When to escalate to human staff
- Cultural sensitivity and inclusiveness
- Conversation flow and patient experience

DO NOT include:
- Specific clinic data (services, hours, insurance, contact info) - AI tools will provide this dynamically
- Tool definitions or technical instructions - these are added separately
- Outdated information that might change - tools fetch current data

Create a {hasInterviewData} system prompt while maintaining medical professionalism and safety standards.`
  );

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [finalUserPrompt, setFinalUserPrompt] = useState('');

  const generateRandomInputs = () => {
    const randomTemplates = ['general', 'urgent-care', 'dental', 'mental-health'];
    const randomTemplate = randomTemplates[Math.floor(Math.random() * randomTemplates.length)];
    
    const randomCustomInstructions = [
      'Focus on preventive care and patient education',
      'Emphasize efficiency and quick turnaround',
      'Holistic approach with natural remedies focus',
      'High-volume practice with streamlined processes'
    ];
    
    const randomPracticeNames = ['Oakwood Medical Center', 'River Valley Clinic', 'Metro Health Associates', 'Greenfield Family Practice'];
    const randomDoctorNames = ['Dr. Michael Chen', 'Dr. Lisa Rodriguez', 'Dr. James Thompson', 'Dr. Amanda Miller'];
    const randomSpecialties = ['Family Medicine', 'Internal Medicine', 'Urgent Care', 'Pediatrics'];
    
    setTemplate(randomTemplate);
    setCustomInstructions(randomCustomInstructions[Math.floor(Math.random() * randomCustomInstructions.length)]);
    
    const randomClinic = {
      practice_name: randomPracticeNames[Math.floor(Math.random() * randomPracticeNames.length)],
      doctor_name: randomDoctorNames[Math.floor(Math.random() * randomDoctorNames.length)],
      specialty: randomSpecialties[Math.floor(Math.random() * randomSpecialties.length)]
    };
    
    setClinicData(JSON.stringify(randomClinic, null, 2));
  };

  const buildFinalUserPrompt = () => {
    try {
      const clinic = JSON.parse(clinicData);
      const responses = JSON.parse(interviewResponses);
      
      const templateDescriptions = {
        'general': 'Balanced approach for family medicine and general health',
        'urgent-care': 'Efficient triage and quick assessment focus',
        'specialist': 'Detailed, condition-specific guidance',
        'dental': 'Oral health and dental procedure focused',
        'mental-health': 'Compassionate, supportive, and non-judgmental',
        'pediatric': 'Child-friendly and parent-focused communication',
        'custom': customInstructions || 'Custom practice approach'
      };

      const templateDescription = templateDescriptions[template as keyof typeof templateDescriptions] || 'General healthcare practice';
      const hasInterviewData = Object.values(responses).some((value: any) => value?.toString().trim().length > 0);
      
      let interviewSection = '';
      if (hasInterviewData) {
        interviewSection = Object.entries(responses)
          .map(([key, value]) => `${key}: "${value}"`)
          .join('\n');
      }

      const finalPrompt = userPromptTemplate
        .replace('{clinic.practice_name}', clinic.practice_name)
        .replace('{clinic.doctor_name}', clinic.doctor_name)
        .replace('{clinic.specialty}', clinic.specialty)
        .replace('{interviewResponses}', interviewSection)
        .replace('{templateDescription}', templateDescription)
        .replace('{custom_instructions}', customInstructions || 'None specified')
        .replace('{hasInterviewData}', hasInterviewData ? 'warm, authentic system prompt that reflects this clinic\'s unique personality' : 'professional system prompt that embodies the template approach');

      return finalPrompt;
    } catch (error) {
      return 'Error: Invalid JSON in clinic data or interview responses';
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const clinic = JSON.parse(clinicData);
      const responses = JSON.parse(interviewResponses);
      
      const finalPrompt = buildFinalUserPrompt();
      setFinalUserPrompt(finalPrompt);

      const response = await fetch('/api/ai-configuration/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic: clinic,
          template: template,
          custom_instructions: customInstructions,
          interviewResponses: responses,
          useInterviewData: true
        })
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedPrompt(data.prompt || 'No prompt returned');
      } else {
        setGeneratedPrompt(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setGeneratedPrompt(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔧 Prompt Generator Debug Tool</h1>
      <p style={{ marginBottom: '30px', color: '#666' }}>
        Internal tool for testing system prompt generation. Edit the OpenAI prompts below and see exactly what gets sent.
      </p>

      {/* INPUT SECTION */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h2>📝 INPUT DATA</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label><strong>Template:</strong></label><br />
          <select value={template} onChange={(e) => setTemplate(e.target.value)} style={{ width: '200px', padding: '5px' }}>
            {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>Custom Instructions:</strong></label><br />
          <textarea 
            value={customInstructions} 
            onChange={(e) => setCustomInstructions(e.target.value)}
            style={{ width: '100%', height: '60px', fontFamily: 'monospace' }}
            placeholder="e.g., Focus on preventive care and patient education"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>Clinic Data (JSON):</strong></label><br />
          <textarea 
            value={clinicData} 
            onChange={(e) => setClinicData(e.target.value)}
            style={{ width: '100%', height: '100px', fontFamily: 'monospace' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>Interview Responses (JSON):</strong></label><br />
          <textarea 
            value={interviewResponses} 
            onChange={(e) => setInterviewResponses(e.target.value)}
            style={{ width: '100%', height: '200px', fontFamily: 'monospace' }}
          />
        </div>

        <button 
          onClick={generateRandomInputs}
          style={{ padding: '8px 16px', marginRight: '10px', backgroundColor: '#f0f0f0' }}
        >
          🎲 Generate Random Inputs
        </button>
      </div>

      {/* OPENAI PROMPTS SECTION */}
      <div style={{ border: '1px solid #orange', padding: '20px', marginBottom: '20px', backgroundColor: '#fff9e6' }}>
        <h2>🤖 OPENAI PROMPTS (EDITABLE)</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>These are the exact system/user messages sent to OpenAI:</p>
        
        <div style={{ marginBottom: '15px' }}>
          <label><strong>System Message:</strong></label><br />
          <textarea 
            value={systemPrompt} 
            onChange={(e) => setSystemPrompt(e.target.value)}
            style={{ width: '100%', height: '80px', fontFamily: 'monospace', border: '2px solid orange' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>User Message Template (with variables):</strong></label><br />
          <textarea 
            value={userPromptTemplate} 
            onChange={(e) => setUserPromptTemplate(e.target.value)}
            style={{ width: '100%', height: '400px', fontFamily: 'monospace', border: '2px solid orange' }}
          />
          <p style={{ fontSize: '12px', color: '#666' }}>
            Variables: {'{clinic.practice_name}'}, {'{clinic.doctor_name}'}, {'{clinic.specialty}'}, {'{interviewResponses}'}, {'{templateDescription}'}, {'{custom_instructions}'}, {'{hasInterviewData}'}
          </p>
        </div>
      </div>

      {/* FINAL ASSEMBLED PROMPT PREVIEW */}
      <div style={{ border: '1px solid #blue', padding: '20px', marginBottom: '20px', backgroundColor: '#f0f8ff' }}>
        <h2>👁️ FINAL USER PROMPT (ASSEMBLED)</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>This is what actually gets sent to OpenAI after variable substitution:</p>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', whiteSpace: 'pre-wrap', fontSize: '12px', border: '1px solid #ddd' }}>
          {buildFinalUserPrompt()}
        </pre>
      </div>

      {/* SUBMIT AND RESULTS */}
      <div style={{ border: '1px solid #green', padding: '20px', backgroundColor: '#f0fff0' }}>
        <h2>🚀 GENERATE & RESULTS</h2>
        
        <button 
          onClick={handleSubmit}
          disabled={isLoading}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: isLoading ? '#ccc' : '#28a745', 
            color: 'white', 
            border: 'none',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '⏳ Generating...' : '🎯 Generate System Prompt'}
        </button>

        {generatedPrompt && (
          <div style={{ marginTop: '20px' }}>
            <label><strong>Generated System Prompt:</strong></label><br />
            <textarea 
              value={generatedPrompt}
              readOnly
              style={{ 
                width: '100%', 
                height: '300px', 
                fontFamily: 'monospace', 
                backgroundColor: '#f8f9fa',
                border: '2px solid #28a745'
              }}
            />
            <button 
              onClick={() => navigator.clipboard.writeText(generatedPrompt)}
              style={{ marginTop: '10px', padding: '5px 10px' }}
            >
              📋 Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}