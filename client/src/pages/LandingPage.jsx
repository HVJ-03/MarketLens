import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { MarketLensLandingPage } from '../components/landing/threeui/LandingPages.tsx';
import '../components/landing/threeui/threeui.css';

/**
 * Public landing page. The ThreeUI Kage scene runs as its own document inside a
 * same-origin frame; links in it marked with data-route are handed to the app's
 * router instead of navigating the frame. Signed-in visitors get the
 * data-route-auth target and data-label-auth text where a link defines them.
 */
export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // The frame's click listener outlives renders, so it reads the latest values here.
  const routing = useRef({ user, navigate });
  useEffect(() => {
    routing.current = { user, navigate };
  }, [user, navigate]);

  const applyScene = useCallback(
    (frame) => {
      const doc = frame.contentDocument;
      if (!doc) return;

      doc.querySelectorAll('a[data-route]').forEach((link) => {
        if (!link.dataset.labelDefault) {
          const label = link.querySelector('span') || link;
          link.dataset.labelDefault = label.textContent;
        }
        const label = link.querySelector('span') || link;
        const signedIn = Boolean(user) && link.dataset.routeAuth;
        label.textContent = signedIn && link.dataset.labelAuth ? link.dataset.labelAuth : link.dataset.labelDefault;
        link.setAttribute('href', signedIn ? link.dataset.routeAuth : link.dataset.route);
      });

      // One capturing listener per loaded document.
      if (doc.documentElement.dataset.routerBridge) return;
      doc.documentElement.dataset.routerBridge = 'on';
      doc.addEventListener(
        'click',
        (event) => {
          const link = event.target.closest?.('a[data-route]');
          if (!link || event.defaultPrevented || event.button !== 0) return;
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          const { user: current, navigate: go } = routing.current;
          go(current && link.dataset.routeAuth ? link.dataset.routeAuth : link.dataset.route);
        },
        true
      );
    },
    [user]
  );

  return (
    <div className="shader-frame">
      <MarketLensLandingPage
        headingFont="onest"
        bodyFont="onest"
        headingWeight="400"
        bodyWeight="300"
        primaryColor="#e0231c"
        headingSize={46}
        bodySize={17}
        headingLetterSpacing={-0.012}
        applyScene={applyScene}
      />
    </div>
  );
}
