---
name: Autodraft
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c8'
  surface-tint: '#5d5f5f'
  primary: '#5d5f5f'
  on-primary: '#ffffff'
  primary-container: '#ffffff'
  on-primary-container: '#747676'
  inverse-primary: '#c6c6c7'
  secondary: '#5d5e60'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe1'
  on-secondary-container: '#616365'
  tertiary: '#005cbb'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffffff'
  on-tertiary-container: '#0973e5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e2e2e4'
  secondary-fixed-dim: '#c6c6c8'
  on-secondary-fixed: '#1a1c1d'
  on-secondary-fixed-variant: '#454749'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#abc7ff'
  on-tertiary-fixed: '#001b3f'
  on-tertiary-fixed-variant: '#00458f'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 56px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  scale: '{''xs'': ''4px'', ''sm'': ''8px'', ''md'': ''16px'', ''lg'': ''24px'', ''xl'':
    ''48px'', ''xxl'': ''80px''}'
---

## Brand & Style
The design system is rooted in **Minimalism** and **High-End Tech Aesthetic**, drawing inspiration from contemporary luxury hardware and elite software platforms like Linear and Apple. It is designed for high-performing professionals who value precision, clarity, and time.

The brand personality is authoritative yet understated. It avoids decorative clutter in favor of functional elegance. The emotional response should be one of "quiet power"—a platform that feels expensive, reliable, and effortless.

**Key Visual Principles:**
- **Reductionist Hierarchy:** If an element doesn't serve a functional purpose, it is removed.
- **Precision Spacing:** Mathematical consistency in gutters and margins to evoke a sense of architectural stability.
- **Micro-interactions:** Motion should be swift and fluid, utilizing "Ease-Out" cubic-bezier curves to mimic physical inertia.

## Colors
The palette is a **Luxury Monochrome** execution. It relies heavily on the interplay between pure white and subtle off-white grays to create depth without introducing visual noise.

- **Primary White (#FFFFFF):** Used for the main canvas and high-elevation cards.
- **Secondary Gray (#F5F5F7):** Used for background fills to make white cards "pop."
- **Border (#E5E5E7):** A hairline-thin separator used to define structure without adding weight.
- **Accent Blue (#0071E3):** Reserved strictly for primary calls to action, active states, and critical data points. It is the "laser focus" color.
- **Text:** Primary text uses a deep onyx (#111111) for maximum legibility, while secondary text uses a softer slate (#86868B) for metadata and labels.

## Typography
This design system utilizes a dual-font strategy to balance character with utility. 

**Hanken Grotesk** is used for headings to provide a modern, sharp, and premium feel. It features a tight tracking at larger sizes to mimic high-end editorial layouts.

**Inter** is the workhorse for body copy and interface elements. It is chosen for its exceptional legibility at small sizes and its neutral, systematic appearance.

**Hierarchy Rules:**
- Large display headings should always use negative letter spacing (`-0.01em` to `-0.02em`).
- Body text should maintain a generous line height (`1.6`) to prevent visual fatigue during long reading sessions.
- Labels and captions should be set in Medium weight to maintain presence despite their small scale.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. While content is housed within a 1200px max-width container to ensure readability, background surfaces and navigation bars extend to the full viewport width.

**Grid System:**
- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px gutters.

**Whitespace Philosophy:**
Use whitespace as a structural element. Elements should be grouped using the Law of Proximity—keep related items within `16px` of each other, while separating major sections with at least `80px` (xxl) to create a premium, unhurried pace.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Tonal Layering** rather than heavy drop shadows.

- **Level 0 (Base):** Background color `#F5F5F7`.
- **Level 1 (Cards/Containers):** Pure `#FFFFFF` with a 1px border `#E5E5E7`.
- **Level 2 (Dropdowns/Modals):** Pure `#FFFFFF` with a soft ambient shadow: `0 12px 40px rgba(0,0,0,0.08)`.
- **Level 3 (Overlays):** Backdrop-filter `blur(20px)` with a semi-transparent white fill `rgba(255, 255, 255, 0.7)`.

Shadows should never look "muddy." They must use a low-opacity black tint to ensure they look like light is naturally diffusing around the object.

## Shapes
The shape language is **Refined and Modern**. 

A standard corner radius of `0.5rem` (8px) is applied to buttons and small inputs. Larger components like dashboard cards use `1rem` (16px) to appear softer and more approachable.

- **Standard Radius:** 8px (Buttons, Inputs, Chips)
- **Large Radius:** 16px (Cards, Modals, Sections)
- **Full Radius:** 9999px (Status indicators, Search bars)

Avoid sharp 0px corners to maintain the friendly, high-tech "Apple-like" feel.

## Components
Consistent execution of components is vital to maintaining the "Autodraft" premium feel.

- **Buttons:** Primary buttons use `#0071E3` with white text. Secondary buttons use a white background with a `#E5E5E7` border. Use a `0.2s` transition on hover for a slight lift or opacity change.
- **Cards:** Use white backgrounds, a subtle 1px border, and no shadow for static cards. On hover, apply a soft shadow and a slight y-axis translation (-2px).
- **Inputs:** Minimalist design with a 1px border. On focus, the border transitions to the accent blue with a subtle glow (2px spread, 10% opacity blue).
- **Navigation:**
    - **Top Nav:** Fixed, with a backdrop-blur (glassmorphism) effect. High-contrast labels with active states marked by a small dot or bold weight.
    - **Sidebar:** Subtle light gray background with "Active" states using a white card-like highlight.
- **Data Visualization:** Use "Stripe-style" charts—thin lines, no grid lines (or very faint ones), and monochromatic gradients for area charts. Use the accent blue for the primary data line.
- **Chips/Badges:** Small, uppercase labels with a light gray background and dark gray text. Rounded-full.