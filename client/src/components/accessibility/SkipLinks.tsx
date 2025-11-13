/**
 * Skip Links Component
 * WCAG 2.4.1: Bypass Blocks
 * Allows keyboard users to skip repetitive content
 */

import React from 'react';
import { SkipLink } from '../../types/accessibility';
import './SkipLinks.css';

interface SkipLinksProps {
  links: SkipLink[];
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Remove tabindex after blur
      target.addEventListener(
        'blur',
        () => {
          target.removeAttribute('tabindex');
        },
        { once: true }
      );
    }
  };

  return (
    <nav className="skip-links" aria-label="Skip links">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.targetId}`}
          className="skip-link"
          onClick={(e) => handleSkip(e, link.targetId)}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SkipLinks;
