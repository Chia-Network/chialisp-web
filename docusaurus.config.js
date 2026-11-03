module.exports = {
  title: 'Chialisp',
  tagline: 'Developing with Chialisp',
  url: 'https://chialisp.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  favicon: 'img/favicon.svg',
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#122957',
      },
    },
  ],
  organizationName: 'Chia-Network',
  projectName: 'chialisp-web',
  trailingSlash: true,
  themeConfig: {
    image: '/img/chia-share.png',
    prism: {
      darkTheme: require('./src/theme/prism-dark-theme-chialisp'),
      theme: require('./src/theme/prism-light-theme-chialisp'),
    },
    navbar: {
      logo: {
        alt: 'Chialisp',
        src: 'img/full_logo.svg',
        srcDark: 'img/full_logo-on-dark.svg',
        width: 144,
        height: 37,
      },
      items: [
        {
          href: 'https://docs.chia.net',
          label: 'Chia Docs',
          position: 'left',
        },
        {
          href: 'https://docs.chia.net/academy-home/',
          label: 'Chia Academy',
          position: 'left',
        },
        {
          href: 'https://www.chia.net/',
          label: 'Chia.net',
          position: 'right',
        },
        {
          href: 'https://github.com/Chia-Network/',
          label: 'GitHub',
          position: 'right',
        },

      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Operators',
              to: '/operators',
            },
            {
              label: 'CLVM',
              to: '/clvm',
            },
            {
              label: 'Chia Docs',
              href: 'https://docs.chia.net',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/chia',
            },
            {
              label: 'X',
              href: 'https://x.com/chia_project',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              href: 'https://www.chia.net/blog/',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/Chia-Network/clvm',
            },
          ],
        },
      ],
      logo: {
        alt: 'Chialisp full logo',
        src: 'img/full_logo-on-dark.svg',
        href: '/',
        width: 160,
      },
      copyright: `© ${new Date().getFullYear()} Chia Network Inc., Licensed under the <a href="https://github.com/Chia-Network/chialisp-web/blob/main/LICENSE" target="_blank">Apache License, Version 2.0</a> | <a href="https://www.chia.net/terms/">Terms</a>`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/Chia-Network/chialisp-web/blob/main/',
        },
      },
    ],
  ],
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        language: ['en', 'zh'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: '/',
      }),
    ],
  ],
  scripts: [
    {
      src: '/js/matomo.js',
      async: true,
      defer: true,
    },
  ],
};
