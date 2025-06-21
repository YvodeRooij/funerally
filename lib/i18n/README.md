# Farewelly Internationalization (i18n) System

## Overview

This comprehensive i18n system provides multi-language support for Farewelly using next-intl, with special attention to cultural sensitivity and RTL language support.

### Supported Languages

- **Dutch (nl)** - Default language, primary for Netherlands market
- **English (en)** - International communication
- **Arabic (ar)** - RTL support, Islamic cultural considerations
- **Turkish (tr)** - Turkish community support

## Quick Start

### 1. Import the necessary components and hooks

```typescript
import { useAppTranslations, LanguageSelector } from '@/lib/i18n';

function MyComponent() {
  const { common, navigation } = useAppTranslations();
  
  return (
    <div>
      <h1>{navigation('home')}</h1>
      <button>{common('save')}</button>
      <LanguageSelector variant="dropdown" />
    </div>
  );
}
```

### 2. Use RTL-aware layouts

```typescript
import { useRTLLayout } from '@/lib/i18n';

function MyComponent() {
  const { getRTLClasses, getTextAlign } = useRTLLayout();
  
  return (
    <div className={getRTLClasses('flex items-center space-x-4')}>
      <p className={getTextAlign('left')}>Content</p>
    </div>
  );
}
```

### 3. Cultural context integration

```typescript
import { useCulturalContext } from '@/lib/i18n';

function GreetingComponent() {
  const { getGreeting, getCondolenceMessage } = useCulturalContext();
  
  return (
    <div>
      <p>{getGreeting()}</p>
      <p>{getCondolenceMessage()}</p>
    </div>
  );
}
```

## File Structure

```
/lib/i18n/
├── config.ts              # Configuration and locale definitions
├── hooks.ts               # Custom hooks for translations and RTL
├── index.ts               # Main exports
├── rtl-styles.css         # RTL-specific CSS
├── messages/              # Translation files
│   ├── nl.json           # Dutch translations
│   ├── en.json           # English translations
│   ├── ar.json           # Arabic translations
│   └── tr.json           # Turkish translations
└── components/           # i18n React components
    ├── language-provider.tsx
    └── language-selector.tsx
```

## Configuration Files

### Next.js Configuration

The `next.config.mjs` has been updated to include next-intl:

```javascript
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./lib/i18n/config.ts');
export default withNextIntl(nextConfig);
```

### Middleware

Automatic language detection and routing is handled by `middleware.ts`:

- Detects browser language preferences
- Persists language choice in cookies
- Handles locale-specific routing
- Supports RTL layout switching

## Available Hooks

### `useAppTranslations()`

Main translation hook providing access to all translation namespaces:

```typescript
const {
  navigation,    // Navigation menu items
  hero,         // Hero section content
  common,       // Common UI elements
  auth,         // Authentication forms
  onboarding,   // User onboarding
  dashboard,    // Dashboard content
  family,       // Family-specific content
  director,     // Director-specific content
  venue,        // Venue-specific content
  booking,      // Booking system
  documents,    // Document management
  communication,// Chat and messaging
  cultural,     // Cultural preferences
  errors,       // Error messages
  success,      // Success messages
  time,         // Time-related content
} = useAppTranslations();
```

### `useLocaleInfo()`

Provides current locale information:

```typescript
const {
  locale,           // Current locale (nl, en, ar, tr)
  isRTL,           // Boolean: is right-to-left language
  textDirection,    // 'rtl' or 'ltr'
  name,            // Display name of language
  flag,            // Flag emoji
  dateFormat,      // Locale-specific date format
  timeFormat,      // Locale-specific time format
  currency,        // Currency code
  culturalContext, // Cultural context identifier
} = useLocaleInfo();
```

### `useLocaleSwitch()`

Language switching functionality:

```typescript
const { switchLocale, isPending } = useLocaleSwitch();

// Switch to Arabic
switchLocale('ar');
```

### `useRTLLayout()`

RTL layout utilities:

```typescript
const {
  isRTL,
  getRTLClasses,    // Automatically flip CSS classes for RTL
  getFlexDirection, // Get correct flex direction
  getTextAlign,     // Get correct text alignment
} = useRTLLayout();
```

### `useCulturalContext()`

Cultural sensitivity features:

```typescript
const {
  culturalContext,
  getGreeting,              // Culturally appropriate greeting
  getCondolenceMessage,     // Culturally appropriate condolence
  getReligiousConsiderations, // Religious requirements
} = useCulturalContext();
```

### `useDateTimeFormat()`

Locale-aware date and time formatting:

```typescript
const {
  formatDate,        // Format date according to locale
  formatTime,        // Format time according to locale
  formatDateTime,    // Format full date-time
  formatRelativeTime, // Format relative time (e.g., "2h ago")
} = useDateTimeFormat();
```

## Components

### `<LanguageSelector />`

Flexible language selector with multiple variants:

```typescript
// Dropdown variant (default)
<LanguageSelector variant="dropdown" />

// Inline buttons
<LanguageSelector variant="inline" showFlag={true} showName={true} />

// Modal selector
<LanguageSelector variant="modal" />

// Compact selector for mobile
<CompactLanguageSelector />
```

### `<LanguageProvider />`

Wrap your app with the language provider:

```typescript
<LanguageProvider messages={messages} locale={locale}>
  {children}
</LanguageProvider>
```

## RTL Support

### Automatic CSS Class Flipping

The `getRTLClasses()` function automatically converts LTR classes to RTL:

```typescript
const { getRTLClasses } = useRTLLayout();

// Automatically converts ml-4 to mr-4 in RTL languages
const classes = getRTLClasses('flex items-center ml-4 text-left');
```

### RTL-Specific Styles

Include the RTL stylesheet in your app:

```css
@import '@/lib/i18n/rtl-styles.css';
```

### Manual RTL Handling

For complex layouts, use the RTL utilities:

```typescript
const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();

return (
  <div className={`flex ${getFlexDirection()} ${getTextAlign('left')}`}>
    {isRTL ? <RightContent /> : <LeftContent />}
  </div>
);
```

## Cultural Considerations

### Arabic Language Support

- **RTL Layout**: Automatic right-to-left layout
- **Islamic Greetings**: "السلام عليكم" (As-salamu alaykum)
- **Condolences**: "إنا لله وإنا إليه راجعون" (Inna lillahi wa inna ilayhi raji'un)
- **Prayer Times**: Support for Islamic prayer requirements
- **Halal Considerations**: Dietary and cultural requirements

### Turkish Language Support

- **Cultural Greetings**: "Merhaba" 
- **Condolences**: "Başınız sağ olsun"
- **Religious Considerations**: Islamic customs where applicable

### Dutch Language Support

- **Local Customs**: Understanding of Dutch funeral traditions
- **Formal Address**: Appropriate formal language for sensitive topics
- **Cultural Sensitivity**: Awareness of secular and religious preferences

## Memory Integration

All translations are stored in the Memory system under:

```
swarm-auto-centralized-1750494292308/i18n/translations/
├── nl (Dutch translations)
├── en (English translations)  
├── ar (Arabic translations)
└── tr (Turkish translations)
```

## Best Practices

### 1. Always Use Translation Keys

```typescript
// Good
const { common } = useAppTranslations();
return <button>{common('save')}</button>;

// Bad
return <button>Save</button>;
```

### 2. Consider Cultural Context

```typescript
const { culturalContext } = useCulturalContext();

// Adjust UI based on cultural needs
if (culturalContext === 'arabic') {
  // Show prayer time indicators
  // Use appropriate greetings
  // Consider Islamic customs
}
```

### 3. Test RTL Layouts

```typescript
// Always test components in RTL mode
const { isRTL } = useRTLLayout();

// Use data-testid for RTL testing
<div data-testid={isRTL ? 'rtl-layout' : 'ltr-layout'}>
```

### 4. Handle Pluralization

```typescript
// Use next-intl's built-in pluralization
const t = useTranslations('common');
return t('itemCount', { count: items.length });
```

### 5. Format Dates and Times Appropriately

```typescript
const { formatDate, formatTime } = useDateTimeFormat();

// Always format dates according to locale
return (
  <div>
    <span>{formatDate(appointment.date)}</span>
    <span>{formatTime(appointment.time)}</span>
  </div>
);
```

## Adding New Languages

To add a new language:

1. Add the locale to `config.ts`
2. Create translation file in `messages/`
3. Update the `localeConfig` object
4. Add cultural considerations if needed
5. Test RTL support if applicable
6. Store translations in Memory

## Troubleshooting

### Common Issues

1. **Missing Translations**: Check that all keys exist in all language files
2. **RTL Layout Issues**: Use `getRTLClasses()` for automatic handling
3. **Cultural Insensitivity**: Review translations with native speakers
4. **Performance**: Use namespace-specific hooks instead of loading all translations

### Debugging

```typescript
// Debug current locale info
const localeInfo = useLocaleInfo();
console.log('Current locale:', localeInfo);

// Debug RTL status
const { isRTL } = useRTLLayout();
console.log('Is RTL:', isRTL);
```

## Performance Considerations

- Translations are loaded per locale (lazy loading)
- RTL styles are applied only when needed
- Memory system provides efficient caching
- Cultural context is computed only once per locale change

This i18n system ensures Farewelly can serve its diverse user base in the Netherlands with cultural sensitivity and technical excellence.