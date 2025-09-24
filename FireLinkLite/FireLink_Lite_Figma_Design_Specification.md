# FireLink Lite - Figma Design Specification

## Project Overview
FireLink Lite is a Progressive Web App (PWA) for emergency alert system with real-time notifications, WebRTC voice calling, and geolocation-based panic alerts.

## Color Palette

### Primary Colors
- **Emergency Red**: `#DC2626` (HSL: 0, 85%, 50%)
- **Emergency Red Dark**: `#B91C1C` (HSL: 0, 85%, 55%)
- **Primary Blue**: `#3B82F6` (HSL: 221.2, 83.2%, 53.3%)
- **Success Green**: `#059669` (HSL: 142, 76%, 36%)
- **Warning Red**: `#DC2626` (HSL: 0, 85%, 50%) - Updated to red

### Background Colors
- **Light Background**: `#FAFAF9` (HSL: 210, 40%, 98%)
- **Card Background**: `#FFFFFF` (HSL: 0, 0%, 100%)
- **Dark Background**: `#0F172A` (HSL: 222.2, 84%, 4.9%)

### Text Colors
- **Primary Text**: `#1F2937` (HSL: 222.2, 84%, 4.9%)
- **Muted Text**: `#6B7280` (HSL: 215.4, 16.3%, 46.9%)
- **Light Text**: `#FAFAF9` (HSL: 210, 40%, 98%)

### Border Colors
- **Border**: `#E5E7EB` (HSL: 214.3, 31.8%, 91.4%)
- **Input Border**: `#E5E7EB` (HSL: 214.3, 31.8%, 91.4%)

## Typography

### Font Family
- **Primary**: Inter, system-ui, sans-serif
- **Weights**: 300, 400, 500, 600, 700, 800

### Text Styles
- **H1**: 48px, Font Weight 700 (Mobile: 36px)
- **H2**: 32px, Font Weight 600 (Mobile: 24px)
- **H3**: 24px, Font Weight 600 (Mobile: 20px)
- **Body Large**: 18px, Font Weight 400
- **Body**: 16px, Font Weight 400
- **Body Small**: 14px, Font Weight 400
- **Caption**: 12px, Font Weight 400

## App Structure & Navigation

### Navigation Tabs (Fixed Top)
- **Height**: 64px
- **Background**: Card Background with bottom border
- **Tabs**: SOS, Community, EMS, Call
- **Icons**: FontAwesome icons (fas fa-exclamation-triangle, fas fa-users, fas fa-headset, fas fa-phone)

## Screen Designs

### 1. SOS Page (Home Screen)

#### Header Section
- **Title**: "FireLink Lite" (H1, centered)
- **Subtitle**: "Emergency Alert System" (Body, muted)
- **Margin**: 32px bottom

#### Location Status Card
- **Background**: Card Background
- **Padding**: 16px
- **Border Radius**: 12px
- **Icon**: fas fa-map-marker-alt (Primary Blue)
- **Status Text**: Current Location (Body Small, bold)
- **Coordinates**: Latitude, Longitude (Caption, muted)
- **Update Button**: Ghost button, right aligned

#### Manual Location Entry (if GPS unavailable)
- **Layout**: 2-column grid for lat/lng inputs
- **Input Height**: 40px
- **Set Location Button**: Full width, outline style

#### Audio Permission Card
- **Background**: Warning background (red/10 opacity)
- **Border**: Warning border (red/20 opacity)
- **Icon**: fas fa-volume-up (Warning Red)
- **Enable Sounds Button**: Warning Red background

#### Main SOS Button
- **Size**: 256px × 256px circle
- **Background**: Emergency Red with gradient
- **Text**: "SOS" (48px, Font Weight 800)
- **Subtitle**: "Press for Emergency" (14px)
- **Icon**: fas fa-exclamation-triangle (64px)
- **Animation**: Pulsing effect (scale 1 to 1.05)
- **Shadow**: Red glow effect

#### Optional Information Form
- **Card Background**: Standard card
- **Title**: "Optional Information" (H3)
- **Fields**:
  - Emergency Type dropdown
  - Name input field
  - Phone input field  
  - Description textarea (80px height)
- **Submit Button**: Full width, primary style with success state

### 2. Community Page

#### Map Container
- **Height**: 300px minimum
- **Background**: Gradient from muted to accent
- **Border Radius**: 12px
- **Integration**: Leaflet/OpenStreetMap

#### Active Alerts List
- **Card Layout**: Each alert in individual card
- **Alert Badge**: Emergency/Warning colored badges
- **Distance**: Proximity in meters
- **Action Buttons**: "I'm On My Way", "I'm Helping"

### 3. EMS Dashboard Page

#### Header Section
- **Title**: "EMS Dashboard" (H2)
- **Subtitle**: "Emergency Management System"
- **Status Indicator**: Green dot + "On Duty"
- **Sign Out Button**: Outline style, right aligned

#### Stats Overview (4-Column Grid)
- **Card Size**: Equal height (120px)
- **Icons**: Large (32px) in brand colors
- **Numbers**: H1 style in respective colors
- **Labels**: Body Small, muted

#### Emergency Control Center (NEW)
- **Grid**: 4 buttons in responsive grid
- **Button Size**: 80px height
- **Panic Alert**: Emergency Red background
- **Evacuation**: Orange background (#EA580C)
- **Shelter**: Yellow background (#CA8A04)
- **Test Alert**: Outline style

#### Alert Queue
- **List Layout**: Stacked cards with dividers
- **Priority Badges**: Color-coded status indicators
- **Action Buttons**: Call, Dispatch, View Details
- **Info Layout**: Left-aligned details, right-aligned actions

#### Callback Requests
- **Similar to Alert Queue**
- **Actions**: Call Now, Schedule

### 4. EMS Login Page

#### Centered Login Card
- **Max Width**: 400px
- **Card Padding**: 32px
- **Title**: "EMS Login" (H2, centered)
- **Form Fields**: Username, Password (40px height)
- **Login Button**: Full width, primary
- **Demo Button**: Full width, outline style

### 5. Call Page (WebRTC Interface)

#### Call Controls
- **Large circular buttons** for:
  - Mute/Unmute
  - Speaker On/Off
  - End Call
- **Status Display**: Connection status
- **Volume Indicators**: Audio level meters

## Component Library

### Buttons
- **Primary**: Emergency Red background, white text
- **Secondary**: Primary Blue background, white text  
- **Success**: Success Green background, white text
- **Warning**: Warning Red background, white text
- **Outline**: Transparent background, colored border
- **Ghost**: Transparent background, colored text

### Cards
- **Default**: White background, subtle shadow
- **Padding**: 16px standard, 24px for content cards
- **Border Radius**: 12px
- **Shadow**: `0 1px 3px rgba(0, 0, 0, 0.1)`

### Form Elements
- **Input Height**: 40px
- **Border Radius**: 8px
- **Border**: Input Border color
- **Focus State**: Primary Blue border
- **Placeholder**: Muted text color

### Icons
- **Source**: FontAwesome
- **Sizes**: 16px (small), 24px (medium), 32px (large), 64px (xl)
- **Colors**: Match text colors or component themes

## Layout Specifications

### Mobile-First Design
- **Container Max Width**: 768px (mobile), 1200px (desktop)
- **Padding**: 16px mobile, 32px desktop
- **Grid Gaps**: 16px mobile, 24px desktop

### Spacing System
- **xs**: 4px
- **sm**: 8px  
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### Responsive Breakpoints
- **Mobile**: 0-768px
- **Tablet**: 768px-1024px
- **Desktop**: 1024px+

## Animation & Interactions

### SOS Button
- **Idle**: Pulsing animation (1.5s duration)
- **Hover**: Scale to 1.02
- **Active**: Scale to 0.95
- **Loading**: Spinner + pulse

### Emergency Alerts
- **Entrance**: Slide up animation
- **Color Transitions**: 200ms ease
- **Button Interactions**: 150ms ease

## Figma File Structure

### Pages
1. **Design System**: Colors, typography, components
2. **Mobile Screens**: All mobile layouts
3. **Desktop Screens**: Responsive desktop versions
4. **Components**: Reusable component library
5. **User Flow**: Screen connections and interactions

### Component Organization
- **Buttons** (all variants)
- **Cards** (all styles)
- **Forms** (inputs, dropdowns, textareas)
- **Navigation** (tabs, headers)
- **Emergency Controls** (SOS button, alert buttons)
- **Status Indicators** (badges, dots, progress)

## Assets Needed

### Icons
- FontAwesome icon library integration
- Custom emergency service icons
- Status and alert iconography

### Images
- Emergency service placeholders
- Map markers and overlays
- Background patterns (optional)

## Implementation Notes

1. **Create Master Components** for all reusable elements
2. **Use Auto Layout** for responsive behavior
3. **Define Color Styles** for consistent theming
4. **Set up Text Styles** for typography consistency
5. **Create Component Variants** for different states
6. **Build Interactive Prototypes** for user testing
7. **Export Assets** for development handoff

## Accessibility

- **Contrast Ratios**: Meet WCAG AA standards
- **Touch Targets**: Minimum 44px for mobile
- **Focus States**: Clear visual indicators
- **Emergency Contrast**: High contrast for critical actions

This specification provides everything needed to recreate FireLink Lite in Figma with pixel-perfect accuracy.