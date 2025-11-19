# Neural Voice Brand Guidelines

## Overview

Neural Voice is a cutting-edge AI voice assistant platform for business communications. The brand embodies innovation, reliability, and human-like intelligence through a modern, approachable visual identity that balances professionalism with technological sophistication.

## Brand Values
- **Innovation**: Cutting-edge AI technology
- **Reliability**: 24/7 availability and consistent performance  
- **Human-like**: Natural, conversational interactions
- **Efficiency**: Streamlined business processes
- **Accessibility**: No-code setup and user-friendly interface

---

## Color Palette

### Primary Colors

#### Neural Voice Blue
- **Hex**: `#1AADF0`
- **RGB**: `26, 173, 240`
- **Usage**: Primary brand color, main CTAs, links, icons
- **Variations**:
  - Dark: `#0996d4` (hover states)
  - Light: `#C9EEFE` (backgrounds, subtle accents)

#### Neural Voice Red  
- **Hex**: `#F52E60`
- **RGB**: `245, 46, 96`
- **Usage**: Secondary accent, gradient pairs, important highlights
- **Variations**:
  - Light: `#FF5E89` (hover states, lighter contexts)

### Supporting Colors

#### Neural Voice Green
- **Hex**: `#28F16B`
- **RGB**: `40, 241, 107`
- **Usage**: Success states, positive indicators, feature highlights

#### Neural Voice Yellow
- **Hex**: `#FFBC2B`
- **RGB**: `255, 188, 43`
- **Usage**: Warning states, attention-grabbing elements

#### Neural Voice Purple
- **Hex**: `#7E57C2`
- **RGB**: `126, 87, 194`
- **Usage**: Premium features, special callouts
- **Light**: `#EDE7F6` (backgrounds)

### Neutral Colors

#### Grays
- **Light Gray**: `#F5F7FA` (nv-gray - section backgrounds)
- **Medium Gray**: `#6B7280` (text-gray-500 - secondary text)
- **Dark Gray**: `#374151` (text-gray-700 - body text)
- **Charcoal**: `#111827` (text-gray-900 - headings)

#### Background
- **White**: `#FFFFFF` (primary background)
- **Off-white**: `#FAFAFA` (subtle section breaks)

---

## Typography

### Primary Font Family
**DM Sans** - Google Fonts
- Modern, clean, and highly readable
- Excellent for both headings and body text
- Good multilingual support

### Font Weights
- **Regular**: `400` (body text)
- **Medium**: `500` (subheadings, emphasis)
- **Bold**: `700` (main headings, buttons)
- **Extra Bold**: `800` (hero headings, major calls-to-action)

### Typography Scale

#### Headings
```css
/* Hero Titles */
.hero-title {
  font-size: 3rem;    /* 48px */
  font-weight: 700;
  line-height: 1.1;
}

@media (min-width: 640px) {
  .hero-title { font-size: 3.75rem; } /* 60px */
}

@media (min-width: 1024px) {
  .hero-title { font-size: 4.5rem; } /* 72px */
}

/* Section Headlines */
.section-title {
  font-size: 2.25rem;  /* 36px */
  font-weight: 700;
  line-height: 1.2;
}

@media (min-width: 768px) {
  .section-title { font-size: 3.75rem; } /* 60px */
}

/* Card Titles */
.card-title {
  font-size: 1.5rem;   /* 24px */
  font-weight: 700;
  line-height: 1.3;
}
```

#### Body Text
```css
/* Large Body */
.text-large {
  font-size: 1.125rem; /* 18px */
  line-height: 1.6;
  font-weight: 400;
}

/* Regular Body */
.text-base {
  font-size: 1rem;     /* 16px */
  line-height: 1.6;
  font-weight: 400;
}

/* Small Text */
.text-small {
  font-size: 0.875rem; /* 14px */
  line-height: 1.5;
  font-weight: 400;
}
```

---

## Gradients

### Primary Brand Gradient
```css
background: linear-gradient(to right, #20b7f1, #f23e7b);
/* Usage: Primary CTAs, hero elements */
```

### Subtle Background Gradients
```css
/* Light Blue to Red */
background: linear-gradient(to bottom right, #1AADF0/10, #F52E60/10);

/* White to Gray */
background: linear-gradient(to bottom right, #ffffff, #F5F7FA);
```

---

## Spacing & Layout

### Spacing Scale (Tailwind CSS)
- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)  
- **base**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)
- **2xl**: `3rem` (48px)
- **3xl**: `4rem` (64px)

### Container Widths
```css
.container {
  max-width: 80rem; /* 1280px */
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .container { padding: 0 1.5rem; }
}

@media (min-width: 1024px) {
  .container { padding: 0 5rem; }
}
```

### Section Spacing
- **Small sections**: `padding: 3rem 0` (48px top/bottom)
- **Standard sections**: `padding: 6rem 0` (96px top/bottom)  
- **Hero sections**: `padding: 8rem 0` (128px top/bottom)

---

## Border Radius

### Standard Radius Scale
- **Small**: `0.375rem` (6px) - buttons, input fields
- **Medium**: `0.5rem` (8px) - cards, form elements
- **Large**: `0.75rem` (12px) - larger cards, modals
- **Extra Large**: `1rem` (16px) - hero cards, major components
- **Full**: `9999px` - pills, rounded buttons, badges

### Component-Specific Radius
```css
/* Buttons */
.btn-primary {
  border-radius: 9999px; /* Full rounded */
}

/* Cards */
.card {
  border-radius: 1rem; /* 16px */
}

/* Input Fields */
.input {
  border-radius: 0.5rem; /* 8px */
}

/* Badges */
.badge {
  border-radius: 9999px; /* Full rounded */
}
```

---

## Button Styles

### Primary Button
```css
.btn-primary {
  background: linear-gradient(to right, #20b7f1, #f23e7b);
  color: white;
  font-weight: 700;
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  border: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(26, 173, 240, 0.3);
}

/* Shimmer animation */
.btn-primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%);
  animation: shimmer 3s infinite;
  border-radius: inherit;
}
```

### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: #1AADF0;
  font-weight: 700;
  padding: 0.75rem 2rem;
  border: 2px solid #1AADF0;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #1AADF0;
  color: white;
}
```

### Ghost Button
```css
.btn-ghost {
  background: transparent;
  color: #374151;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border: none;
  transition: color 0.3s ease;
}

.btn-ghost:hover {
  color: #1AADF0;
}
```

---

## Component Patterns

### Cards
```css
.card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.card-header {
  margin-bottom: 1.5rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #111827;
}

.card-description {
  color: #6B7280;
  line-height: 1.6;
}
```

### Form Elements
```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #D1D5DB;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.input:focus {
  outline: none;
  border-color: #1AADF0;
  box-shadow: 0 0 0 3px rgba(26, 173, 240, 0.1);
}

.label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}
```

### Badges and Tags
```css
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge-primary {
  background: rgba(26, 173, 240, 0.1);
  color: #1AADF0;
}

.badge-success {
  background: rgba(40, 241, 107, 0.1);
  color: #28F16B;
}
```

---

## Animations & Motion

### Principles
- **Subtle and purposeful**: Animations enhance UX without being distracting
- **Consistent timing**: Use standard durations (0.3s, 0.6s)
- **Easing**: `ease-out` for most transitions, `ease-in-out` for complex animations

### Standard Animations
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Shimmer Effect */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

/* Scale Hover */
.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* Slide Up */
.slide-up {
  animation: fadeIn 0.6s ease-out;
}
```

### Framer Motion Variants
```javascript
const fadeInVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const staggeredVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};
```

---

## Iconography

### Style Guidelines
- **Style**: Outline icons with 2px stroke width
- **Size**: 16px, 20px, 24px standard sizes
- **Color**: Match surrounding text or use brand colors for emphasis
- **Source**: Lucide React or similar modern icon sets

### Usage Examples
```css
.icon-small { width: 1rem; height: 1rem; }
.icon-medium { width: 1.25rem; height: 1.25rem; }
.icon-large { width: 1.5rem; height: 1.5rem; }

.icon-primary { color: #1AADF0; }
.icon-secondary { color: #F52E60; }
.icon-muted { color: #6B7280; }
```

---

## Logo Usage

### Logo Variations
- **Primary**: Black text version (`Logo with Black Text.svg`)
- **Horizontal layout**: Logo + wordmark
- **Minimum size**: 120px width for digital use
- **Clear space**: Minimum 1x logo height around all sides

### Logo Sizing Guidelines
```css
/* Mobile */
.logo-mobile {
  width: 120px;
  height: 28px;
}

/* Tablet */
.logo-tablet {
  width: 130px;
  height: 30px;
}

/* Desktop */
.logo-desktop {
  width: 160px;
  height: 36px;
}

/* Scrolled State */
.logo-scrolled {
  width: 140px;
  height: 32px;
}
```

---

## Background Patterns

### Subtle Textures
```css
/* Grid Pattern */
.bg-grid {
  background-image: url('/assets/grid-pattern.svg');
  background-repeat: repeat;
  opacity: 0.03;
}

/* Gradient Overlays */
.bg-gradient-subtle {
  background: linear-gradient(135deg, #1AADF0/5, #F52E60/5);
}
```

### Decorative Elements
```css
/* Floating Dots */
.floating-dot {
  width: 8px;
  height: 8px;
  background: #1AADF0;
  border-radius: 50%;
  position: absolute;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Blur Circles */
.blur-circle {
  width: 40rem;
  height: 40rem;
  border-radius: 50%;
  filter: blur(80px);
  position: absolute;
  opacity: 0.1;
}

.blur-circle-blue {
  background: #1AADF0;
}

.blur-circle-red {
  background: #F52E60;
}
```

---

## Responsive Design

### Breakpoints
```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Mobile Considerations
- **Touch targets**: Minimum 44px height for buttons
- **Readable text**: Minimum 16px font size
- **Adequate spacing**: Increase padding on mobile
- **Simplified layouts**: Stack elements vertically

---

## Content Guidelines

### Voice & Tone
- **Professional yet approachable**: Authoritative but not intimidating
- **Human-centered**: Focus on benefits to people, not just technology
- **Clear and concise**: Avoid jargon, explain technical concepts simply
- **Action-oriented**: Use strong verbs and clear calls-to-action

### Key Messaging
- **Tagline Options**:
  - "Answer Every Call Like Your Best Employee"
  - "Turn Every Call Into Revenue"
  - "AI Voice Assistants for Business"

### Content Patterns
```markdown
<!-- Hero Section Pattern -->
[Eyebrow Text: "AI VOICE ASSISTANTS FOR BUSINESS"]
# [Action-Oriented Headline]
## [Clear Value Proposition]
[Primary CTA] [Secondary CTA]

<!-- Feature Section Pattern -->
[Badge: "FEATURE CATEGORY"]
## [Benefit-Focused Headline]
[Supporting description that explains the value]

<!-- CTA Section Pattern -->
[Icon] [Benefit Title]
[Brief explanation of the benefit]
```

---

## Implementation Notes

### CSS Custom Properties
```css
:root {
  --nv-blue: #1AADF0;
  --nv-blue-dark: #0996d4;
  --nv-blue-light: #C9EEFE;
  --nv-red: #F52E60;
  --nv-red-light: #FF5E89;
  --nv-green: #28F16B;
  --nv-yellow: #FFBC2B;
  --nv-purple: #7E57C2;
  --nv-gray: #F5F7FA;
  
  --font-sans: 'DM Sans', sans-serif;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
}
```

### Tailwind Configuration
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'nv-blue': '#1AADF0',
        'nv-blue-dark': '#0996d4',
        'nv-blue-light': '#C9EEFE',
        'nv-red': '#F52E60',
        'nv-red-light': '#FF5E89',
        'nv-green': '#28F16B',
        'nv-yellow': '#FFBC2B',
        'nv-purple': '#7E57C2',
        'nv-gray': '#F5F7FA',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
    },
  },
};
```

---

## Quality Checklist

When implementing Neural Voice branding, ensure:

- [ ] DM Sans font is properly loaded
- [ ] Brand colors are used consistently
- [ ] Interactive elements have proper hover states
- [ ] Animations are subtle and purposeful
- [ ] Text has sufficient contrast ratios (WCAG AA)
- [ ] Components are responsive across all breakpoints
- [ ] Loading states and micro-interactions are included
- [ ] Brand voice is consistent in all copy
- [ ] Logo usage follows spacing guidelines
- [ ] Form elements follow the established patterns

---

*This document serves as the comprehensive guide for maintaining brand consistency across all Neural Voice customer-facing platforms and applications.* 