import { translate } from '@docusaurus/Translate';
import React from 'react';
import RibbonHero from '@site/src/components/RibbonHero';

// The 404 as a ribbon hero, with a way back in. The title and first line keep the theme's translated
// strings, so localized builds show them in their own language.
export default function NotFoundContent() {
  return (
    <RibbonHero
      as="main"
      eyebrow="404"
      title={translate({
        id: 'theme.NotFound.title',
        message: 'Page Not Found',
        description: 'The title of the 404 page',
      })}
      lede={translate({
        id: 'theme.NotFound.p1',
        message: 'We could not find what you were looking for.',
        description: 'The first paragraph of the 404 page',
      })}
      actions={[
        {
          label: translate({
            id: 'chialisp.NotFound.home',
            message: 'Chialisp home',
            description: "The 404 page's button back to the Chialisp home",
          }),
          to: '/',
        },
        {
          label: translate({
            id: 'chialisp.NotFound.primer',
            message: 'Chialisp Primer',
            description: "The 404 page's button to the Chialisp Primer",
          }),
          to: '/chialisp-primer/intro',
        },
      ]}
    />
  );
}
