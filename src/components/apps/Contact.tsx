'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { identity } from '@/content/resume';
import styles from './Contact.module.css';

/** Email first, since it's the fastest way to reach me, then the profile links. */
export function Contact() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(identity.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the address is still on screen to select by hand.
    }
  };

  return (
    <>
      <p className={styles.intro}>
        For opportunities or questions about my work, please reach out by email.
      </p>
      <a className={clsx(styles.mail, 'pix')} href={`mailto:${identity.email}`}>
        {identity.email}
      </a>
      <div className={clsx(styles.actions, 'pix')}>
        <button type="button" className="btn" data-variant="solid" onClick={copyEmail}>
          {copied ? 'Copied' : 'Copy email'}
        </button>
        <span className="sr-only" role="status">
          {copied ? 'Email address copied' : ''}
        </span>
        <a className="btn" href={identity.linkedin} target="_blank" rel="me noreferrer">
          LinkedIn
        </a>
        <a className="btn" href={identity.github} target="_blank" rel="me noreferrer">
          GitHub
        </a>
        <a className="btn" href={identity.source}>
          Site source
        </a>
      </div>
    </>
  );
}
