'use client';

import { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { TOUR_DEFINITIONS } from '@/lib/tour-definitions';

/* ─── Props ──────────────────────────────────── */

interface WalkthroughToursProps {
  activeTour: string | null; // tour ID or null
  onTourComplete: (tourId: string) => void;
  onTourSkip: (tourId: string) => void;
}

/* ─── Custom Tooltip ─────────────────────────── */

function TourTooltip({
  continuous,
  index,
  step,
  size,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}: any) {
  return (
    <div
      {...tooltipProps}
      style={{
        ...tooltipProps.style,
        background: '#111',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: 0,
        maxWidth: 360,
        minWidth: 280,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.15)',
        overflow: 'hidden',
      }}
    >
      {/* Gold accent bar at top */}
      <div
        style={{
          height: 3,
          background: 'linear-gradient(90deg, #C9A84C, #D4772C, #C9A84C)',
        }}
      />

      <div style={{ padding: '18px 20px 16px' }}>
        {/* Title */}
        {step.title && (
          <h3
            style={{
              margin: '0 0 6px',
              fontSize: 16,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #C9A84C, #D4772C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.3,
            }}
          >
            {step.title}
          </h3>
        )}

        {/* Content */}
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {step.content}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {/* Left: skip */}
        <button
          {...skipProps}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 13,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          Skip Tour
        </button>

        {/* Right: progress + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Progress indicator */}
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.25)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {index + 1} / {size}
          </span>

          {/* Back button */}
          {index > 0 && (
            <button
              {...backProps}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: 'rgba(255,255,255,0.5)',
                fontSize: 13,
                fontWeight: 600,
                padding: '6px 14px',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}

          {/* Next / Done button */}
          <button
            {...primaryProps}
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #b8942e)',
              border: 'none',
              borderRadius: 8,
              color: '#000',
              fontSize: 13,
              fontWeight: 700,
              padding: '6px 16px',
              cursor: 'pointer',
            }}
          >
            {isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────── */

export default function WalkthroughTours({
  activeTour,
  onTourComplete,
  onTourSkip,
}: WalkthroughToursProps) {
  const pathname = usePathname();

  /* Resolve current tour definition */
  const tourDef = useMemo(() => {
    if (!activeTour) return null;
    return TOUR_DEFINITIONS[activeTour] ?? null;
  }, [activeTour]);

  /* Check if the tour is applicable to the current page */
  const isApplicable = useMemo(() => {
    if (!tourDef) return false;
    // Tours without a pagePrefix can run on any page
    if (!tourDef.pagePrefix) return true;
    // Dashboard tour runs on /admin (exact)
    if (activeTour === 'dashboard') {
      return pathname === '/admin' || pathname === '/admin/';
    }
    // Other tours check prefix match but exclude exact /admin
    return pathname?.startsWith(tourDef.pagePrefix) ?? false;
  }, [tourDef, pathname, activeTour]);

  /* Joyride callback handler */
  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action } = data;

      // Tour finished (all steps completed)
      if (status === STATUS.FINISHED) {
        if (activeTour) onTourComplete(activeTour);
        return;
      }

      // Tour skipped
      if (status === STATUS.SKIPPED) {
        if (activeTour) onTourSkip(activeTour);
        return;
      }

      // User clicked the X close button
      if (action === ACTIONS.CLOSE) {
        if (activeTour) onTourSkip(activeTour);
        return;
      }
    },
    [activeTour, onTourComplete, onTourSkip],
  );

  /* Don't render if no applicable tour */
  if (!isApplicable || !tourDef) return null;

  return (
    <Joyride
      steps={tourDef.steps}
      run={true}
      continuous
      showSkipButton
      showProgress={false}
      disableOverlayClose
      disableCloseOnEsc={false}
      spotlightClicks={false}
      callback={handleCallback}
      tooltipComponent={TourTooltip}
      floaterProps={{
        disableAnimation: true,
        styles: {
          arrow: {
            length: 8,
            spread: 14,
          },
        },
      }}
      styles={{
        options: {
          arrowColor: '#111',
          backgroundColor: '#111',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: '#C9A84C',
          textColor: '#fff',
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: 12,
        },
        overlay: {
          mixBlendMode: undefined as any,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Done',
        last: 'Done',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}
