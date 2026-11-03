import Link from '@docusaurus/Link';
import clsx from 'clsx';
import React from 'react';
import styles from './RibbonHero.module.css';

/**
 * The navy hero band with chia.net's ribbon art. `actions` are the buttons under the lede: the first
 * is the green fill, the rest are outlined. `as` sets the band's element (`header` by default,
 * `main` where the hero is the whole page).
 */
export default function RibbonHero({ as: Tag = 'header', eyebrow, title, lede, actions = [] }) {
  return (
    <Tag className={clsx('hero', styles.heroBanner, Tag === 'main' && styles.heroPage)}>
      <div className={styles.heroArt} aria-hidden="true">
        <div className={styles.heroRibbon}>
          <div className={styles.heroHolo} />
        </div>
      </div>
      <div className={clsx('container', styles.heroContent)}>
        {eyebrow && <p className={clsx('eyebrow', styles.heroEyebrow)}>{eyebrow}</p>}
        <h1 className="hero__title">{title}</h1>
        {lede && <p className={clsx('hero__subtitle', styles.heroLede)}>{lede}</p>}
        {actions.length > 0 && (
          <div className={styles.buttons}>
            {actions.map(({ label, to }, i) => (
              <Link
                key={to}
                className={clsx(
                  'button button--lg',
                  i === 0 ? styles.buttonInverse : styles.buttonInverseOutline
                )}
                to={to}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Tag>
  );
}
