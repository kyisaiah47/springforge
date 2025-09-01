# Orbit Design System

*A sophisticated, minimalist design language inspired by Linear and Raycast*

## Philosophy

Orbit's design embodies the principles of **refined minimalism** - every element serves a purpose while maintaining visual elegance. We prioritize clarity, sophistication, and subtle interactions that enhance productivity without distraction.

## Typography

### Headings
- **Main titles**: `text-4xl md:text-5xl font-light tracking-tight`
- **Section headers**: `text-2xl font-medium tracking-tight`
- **Card titles**: `text-lg font-medium`
- **Emphasis**: Use `font-medium` for selective emphasis within `font-light` contexts

### Body Text
- **Primary**: `text-lg text-muted-foreground`
- **Secondary**: `text-sm text-muted-foreground`
- **Micro**: `text-xs text-muted-foreground`

## Layout Structure

### Page Container
```tsx
<div className="min-h-screen bg-background text-foreground relative overflow-hidden">
  {/* Subtle background gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
  
  <div className="relative z-10 p-6 space-y-8">
    {/* Content here */}
  </div>
</div>
```

### Page Headers
Every module page follows this sophisticated header pattern:

```tsx
<div className="flex items-center justify-between py-6">
  <div className="space-y-3">
    <div className="flex items-center space-x-3">
      <div className="relative">
        <div className="w-3 h-3 bg-[COLOR]-500 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 w-3 h-3 bg-[COLOR]-500/30 rounded-full animate-ping"></div>
      </div>
      <h1 className="text-4xl md:text-5xl font-light tracking-tight">
        [Module] <span className="font-medium">[Name]</span>
      </h1>
    </div>
    <p className="text-lg text-muted-foreground max-w-2xl">
      [Descriptive subtitle explaining the module's purpose]
    </p>
  </div>
  {/* Action buttons */}
</div>
```

## Color System

### Module Color Coding
- **Dashboard**: `blue-500` - Central hub, reliability
- **AutoStand**: `blue-500` - Communication, connectivity  
- **PR Radar**: `green-500` - Growth, progress, code health
- **Retro Arena**: `purple-500` - Collaboration, creativity
- **Debug Arcade**: `orange-500` - Energy, challenges, skill-building
- **Settings**: `blue-500` - Configuration, stability

### Status Colors
- **Active/Success**: `green-500/600` with `green-500/20` background
- **Warning/Pending**: `yellow-500/600` with `yellow-500/20` background
- **Error/Critical**: `red-500/600` with `red-500/20` background
- **Info/Neutral**: `blue-500/600` with `blue-500/20` background

## Components

### Cards
**Base card with glassmorphism:**
```tsx
<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

**Interactive cards with hover effects:**
```tsx
<Card className="border-border/50 bg-card/50 backdrop-blur-sm group hover:bg-card/70 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-primary/5">
  {/* Content */}
</Card>
```

### Buttons
**Primary actions:**
```tsx
<Button className="rounded-xl">Action</Button>
```

**Secondary actions:**
```tsx
<Button variant="outline" className="rounded-xl">Action</Button>
```

### Icon Containers
**Module icons with gradient backgrounds:**
```tsx
<div className="relative">
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[COLOR]-500/20 to-[COLOR]-600/30 border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
    <Icon className="h-6 w-6 text-[COLOR]-600" />
  </div>
  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[COLOR]-500/5 via-transparent to-[COLOR]-600/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
</div>
```

### Status Indicators
**Animated status dots:**
```tsx
<div className="relative">
  <div className="w-3 h-3 bg-[COLOR]-500 rounded-full animate-pulse"></div>
  <div className="absolute inset-0 w-3 h-3 bg-[COLOR]-500/30 rounded-full animate-ping"></div>
</div>
```

### Loading States
**Sophisticated spinners:**
```tsx
<div className="min-h-screen bg-background flex items-center justify-center">
  <div className="relative">
    <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-[COLOR]-500"></div>
    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-[COLOR]-500/20 to-transparent animate-pulse"></div>
  </div>
</div>
```

## Spacing & Layout

### Container Spacing
- **Page padding**: `p-6`
- **Section spacing**: `space-y-8`
- **Card spacing**: `space-y-6`
- **Element spacing**: `space-y-3`

### Grid Systems
**Module grids:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Stats grids:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

## Animations & Transitions

### Hover Effects
- **Scale**: `group-hover:scale-[1.02]`
- **Background**: `hover:bg-card/70 transition-all duration-300`
- **Shadow**: `group-hover:shadow-lg group-hover:shadow-primary/5`
- **Icon scale**: `group-hover:scale-110 transition-transform duration-300`

### Micro-interactions
- **Glow effect**: `opacity-0 group-hover:opacity-100 transition-opacity blur-xl`
- **Reveal text**: `opacity-0 group-hover:opacity-100 transition-opacity`

## Visual Effects

### Glassmorphism
- **Background**: `bg-card/50 backdrop-blur-sm`
- **Borders**: `border-border/50`

### Gradients
- **Page background**: `bg-gradient-to-br from-background via-background to-muted/20`
- **Icon backgrounds**: `bg-gradient-to-br from-[COLOR]-500/20 to-[COLOR]-600/30`
- **Glow effects**: `bg-gradient-to-br from-[COLOR]-500/5 via-transparent to-[COLOR]-600/5`

## Content Patterns

### Section Headers
```tsx
<div className="flex items-center justify-between">
  <h2 className="text-2xl font-medium tracking-tight">[Section Name]</h2>
  <div className="text-sm text-muted-foreground">[Context/Count]</div>
</div>
```

### Empty States
```tsx
<div className="text-center py-16">
  <div className="relative mx-auto w-16 h-16 mb-6">
    <div className="absolute inset-0 bg-gradient-to-br from-[COLOR]-500/20 to-[COLOR]-600/30 rounded-xl border border-border/50 flex items-center justify-center">
      <Icon className="h-8 w-8 text-[COLOR]-600" />
    </div>
  </div>
  <h3 className="text-xl font-medium mb-2">[Title]</h3>
  <p className="text-muted-foreground max-w-md mx-auto mb-6">
    [Description]
  </p>
  <div className="flex items-center justify-center gap-3">
    {/* Action buttons */}
  </div>
</div>
```

## Best Practices

### Do's
- Use consistent spacing patterns (multiples of 4)
- Apply glassmorphism effects to interactive elements
- Include subtle animations for better UX
- Maintain color consistency within modules
- Use font-light for headers with selective font-medium emphasis

### Don'ts
- Avoid harsh borders (use /50 opacity)
- Don't use vibrant background colors
- Avoid sharp corners (use rounded-xl for buttons, rounded-lg for cards)
- Don't mix different border radiuses inconsistently
- Avoid overwhelming animations or effects

## Implementation Notes

This design system creates a **premium, sophisticated experience** that positions Orbit as a revolutionary tool. Every interaction should feel polished and intentional, contributing to the overall perception of quality and innovation.

The aesthetic balances **minimalism with functionality**, ensuring users can focus on their work while enjoying a beautiful, cohesive interface that they'll be proud to use daily.