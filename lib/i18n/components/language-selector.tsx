/**
 * ENHANCED LANGUAGE SELECTOR - Next-intl language switching interface
 * 
 * Purpose: Advanced language selection with cultural awareness
 * Features: Smooth transitions, RTL support, accessibility, persistence
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAppTranslations, useLocaleInfo, useLocaleSwitch, useRTLLayout } from '../hooks';
import { locales, localeConfig, type Locale } from '../config';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'inline' | 'modal';
  size?: 'sm' | 'md' | 'lg';
  showFlag?: boolean;
  showName?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'dropdown',
  size = 'md',
  showFlag = true,
  showName = true,
  className = '',
}: LanguageSelectorProps) {
  const { common, navigation } = useAppTranslations();
  const { locale: currentLocale, name: currentName, flag: currentFlag } = useLocaleInfo();
  const { switchLocale, isPending } = useLocaleSwitch();
  const { getRTLClasses, getTextAlign } = useRTLLayout();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    switchLocale(newLocale);
    setIsOpen(false);
  };

  const buttonClasses = getRTLClasses(
    `${getTextAlign()} transition-all duration-200 ${className}`
  );

  if (variant === 'dropdown') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            className={buttonClasses}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                {showFlag && <span className="mr-1">{currentFlag}</span>}
                {showName && <span>{currentName}</span>}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {locales.map((locale) => {
            const config = localeConfig[locale];
            const isSelected = locale === currentLocale;
            
            return (
              <DropdownMenuItem
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={getRTLClasses('cursor-pointer')}
                disabled={isPending}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <span className="mr-2">{config.flag}</span>
                    <span>{config.name}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={getRTLClasses(`flex flex-wrap gap-2 ${className}`)}>
        {locales.map((locale) => {
          const config = localeConfig[locale];
          const isSelected = locale === currentLocale;
          
          return (
            <Button
              key={locale}
              variant={isSelected ? 'default' : 'outline'}
              size={size}
              onClick={() => handleLocaleChange(locale)}
              disabled={isPending}
              className={getRTLClasses('transition-all duration-200')}
            >
              {isPending && locale === currentLocale ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {showFlag && <span className="mr-1">{config.flag}</span>}
                  {showName && <span>{config.name}</span>}
                </>
              )}
            </Button>
          );
        })}
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <>
        <Button
          variant="ghost"
          size={size}
          onClick={() => setIsOpen(true)}
          className={buttonClasses}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Globe className="h-4 w-4 mr-2" />
              {showFlag && <span className="mr-1">{currentFlag}</span>}
              {showName && <span>{currentName}</span>}
            </>
          )}
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={getRTLClasses('text-lg font-semibold')}>
                    {common('selectLanguage')}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {locales.map((locale) => {
                    const config = localeConfig[locale];
                    const isSelected = locale === currentLocale;
                    
                    return (
                      <Button
                        key={locale}
                        variant={isSelected ? 'default' : 'ghost'}
                        size="lg"
                        onClick={() => handleLocaleChange(locale)}
                        disabled={isPending}
                        className={getRTLClasses('w-full justify-start')}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <span className="mr-3 text-xl">{config.flag}</span>
                            <div className={getRTLClasses('text-left')}>
                              <div className="font-medium">{config.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {config.region}
                              </div>
                            </div>
                          </div>
                          {isPending && locale === currentLocale ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            isSelected && <Check className="h-4 w-4" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </div>

                <div className={getRTLClasses('mt-4 text-sm text-muted-foreground text-center')}>
                  {common('languageWillBeSaved')}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  return null;
}

// Compact language selector for mobile/small spaces
export function CompactLanguageSelector({ className = '' }: { className?: string }) {
  const { flag } = useLocaleInfo();
  const { switchLocale, isPending } = useLocaleSwitch();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${className}`}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span className="text-sm">{flag}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {locales.map((locale) => {
          const config = localeConfig[locale];
          
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => {
                switchLocale(locale);
                setIsOpen(false);
              }}
              className="cursor-pointer"
              disabled={isPending}
            >
              <span className="mr-2">{config.flag}</span>
              <span className="text-xs">{config.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}