# CalmClinic Demo System Documentation

## Overview
The CalmClinic demo system is a code-protected, cinematic presentation tool designed to showcase the product to potential clinic partners. It's built as a premium product showcase with smooth animations, professional polish, and clinic-specific branding.

## Demo Access
- **URL**: `/founder-demo/[clinic-slug]`
- **Protection**: Code-protected with 'DEMO' access code
- **Example**: `https://calmclinic.health/founder-demo/fort-worth-eye`

## File Structure

### Core Components
```
src/components/founder-demo/
├── config/
│   └── ClinicConfigs.ts              # Clinic-specific configurations
├── sections/
│   ├── HeroSection.tsx               # Opening hero with main messaging
│   ├── OriginStorySection.tsx        # Product capabilities overview
│   ├── HowItWorksSection.tsx         # Patient journey visualization
│   ├── DifferentiatorsSection.tsx    # What makes CalmClinic different
│   ├── LiveDemoSection.tsx           # Embedded live chat demo
│   └── CallToActionSection.tsx       # Contact form and next steps
├── shared/
│   ├── SectionContainer.tsx          # Reusable section wrapper
│   └── AnimatedText.tsx              # Text animation component
├── ai-guide/
│   └── AITourGuide.tsx               # Floating AI tour guide
└── FounderDemoLayout.tsx             # Main demo container
```

### Routing & Pages
```
src/app/
├── founder-demo/
│   └── [clinic]/
│       └── page.tsx                  # Dynamic clinic demo page
└── page.tsx                          # Homepage with demo access
```

### Supporting Components
```
src/components/
└── DemoAccess.tsx                    # Code protection component
```

## Technical Architecture

### Dynamic Routing
- Uses Next.js 15 App Router with dynamic segments
- Static generation for performance: `generateStaticParams()`
- Clinic-specific demos via URL slugs

### Clinic Configuration System
Each clinic has a complete configuration object:
```typescript
interface ClinicConfig {
  id: string;
  slug: string;
  practice_name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  suggested_prompts: string[];
  testimonial_quote?: string;
  cta_message: string;
  contact_preference: 'email' | 'phone' | 'form';
}
```

### Animation System
- **Framer Motion** for smooth transitions
- **Scroll-triggered animations** with `whileInView`
- **Staggered text animations** for dramatic effect
- **Particle effects** and floating elements

### Theming System
- CSS variables set dynamically per clinic
- Consistent color application across all components
- Responsive design with mobile-first approach

## Demo Flow Structure

### Section 1: Hero
- **Purpose**: Create immediate impact and set professional tone
- **Key Elements**: Main value proposition, two clear CTAs
- **Animations**: Staggered text reveal, floating particles

### Section 2: Product Overview (was "Origin Story")
- **Purpose**: Explain what makes CalmClinic different
- **Key Elements**: Three core capabilities, visual product showcase
- **Animations**: Timeline-style progression, floating icons

### Section 3: How It Works
- **Purpose**: Show patient journey and process
- **Key Elements**: Step-by-step visualization
- **Animations**: Sequential step reveals

### Section 4: Differentiators
- **Purpose**: Position against generic AI tools
- **Key Elements**: Healthcare-specific focus
- **Animations**: Fade-in content blocks

### Section 5: Live Demo
- **Purpose**: Show actual product in action
- **Key Elements**: Embedded chat interface with clinic branding
- **Integration**: Reuses existing demo chat components

### Section 6: Call to Action
- **Purpose**: Convert interest into conversation
- **Key Elements**: Contact form, next steps, social proof
- **Animations**: Form interactions, success states

## Code Protection System

### DemoAccess Component
```typescript
// Simple code protection with localStorage persistence
const [accessCode, setAccessCode] = useState('');
const [hasAccess, setHasAccess] = useState(false);

// Check for existing access on mount
useEffect(() => {
  const storedAccess = localStorage.getItem('demo-access');
  if (storedAccess === 'granted') {
    setHasAccess(true);
  }
}, []);
```

### Integration
- Added to homepage for demo access
- Persistent access via localStorage
- Simple, bulletproof for presentations

## Animation Performance

### Optimization Techniques
- **Viewport-based triggers**: Animations only fire when elements are visible
- **Once-only animations**: `viewport={{ once: true }}` prevents re-triggers
- **Staggered loading**: Prevents all animations firing simultaneously
- **Hardware acceleration**: Uses transform properties for smooth performance

### Key Animation Patterns
```typescript
// Staggered text reveal
{words.map((word, index) => (
  <motion.span
    key={index}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
  >
    {word}
  </motion.span>
))}

// Section entrance
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  viewport={{ once: true }}
>
```

## Current Configuration

### Fort Worth Eye Associates
- **Slug**: `fort-worth-eye`
- **Colors**: Professional blue/white theme
- **Specialty**: Ophthalmology
- **Messaging**: Product-focused, honest about current stage

## Adding New Clinics

### Step 1: Create Configuration
Add new clinic config to `ClinicConfigs.ts`:
```typescript
export const NEW_CLINIC_CONFIG: ClinicConfig = {
  id: 'new-clinic',
  slug: 'new-clinic',
  practice_name: 'New Clinic Name',
  // ... rest of config
};
```

### Step 2: Update Utility Functions
```typescript
export function getClinicConfig(slug: string): ClinicConfig {
  switch (slug) {
    case 'fort-worth-eye':
      return FORT_WORTH_EYE_CONFIG;
    case 'new-clinic':
      return NEW_CLINIC_CONFIG;
    // ...
  }
}

export function getAllClinicSlugs(): string[] {
  return ['fort-worth-eye', 'new-clinic'];
}
```

### Step 3: Static Generation
The system automatically generates static pages for all clinic slugs.

## Performance Considerations

### Build Optimization
- Static generation for all demo pages
- Optimized bundle splitting
- CSS-in-JS for dynamic theming

### Runtime Performance
- Lazy loading of animations
- Efficient re-renders with proper dependencies
- Minimal JavaScript for core functionality

## Maintenance Notes

### Common Updates
- **Messaging changes**: Update `ClinicConfigs.ts`
- **Visual updates**: Modify section components
- **New animations**: Add to shared components

### Testing Checklist
- [ ] Demo access code works
- [ ] All animations perform smoothly
- [ ] Mobile responsiveness
- [ ] Different clinic configurations
- [ ] Contact form functionality
- [ ] Live demo integration

## Dependencies

### Key Libraries
- **Next.js 15**: App Router, static generation
- **Framer Motion**: Animations and transitions
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling with CSS variables

### Integration Points
- **Existing chat demo**: Reuses demo components
- **Email system**: Contact form integration
- **Authentication**: None required for demo

## Troubleshooting

### Common Issues
1. **Animations not triggering**: Check viewport settings
2. **Styling inconsistencies**: Verify CSS variable application
3. **Build errors**: Check TypeScript prop interfaces
4. **Performance issues**: Review animation complexity

### Debug Tools
- Browser dev tools for animation performance
- Console logs for configuration loading
- Network tab for asset loading times

## Future Enhancements

### Potential Improvements
- [ ] Analytics tracking for demo engagement
- [ ] A/B testing for different messaging
- [ ] Video backgrounds for enhanced visuals
- [ ] Progressive web app features
- [ ] Advanced animation sequences

### Scalability Considerations
- Configuration management for many clinics
- Automated demo generation
- Content management system integration
- Performance monitoring