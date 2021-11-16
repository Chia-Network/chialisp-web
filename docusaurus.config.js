module.exports = {
  title: 'Chialisp',
  tagline: 'Developing with Chialisp',
  url: 'https://staging.chialisp.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',
  organizationName: 'Chia-Network', // Usually your GitHub org/user name.
  projectName: 'staging-chialisp-web', // Usually your repo name.
  themeConfig: {
    prism: {
      darkTheme: require('./src/theme/prism-dark-theme-chialisp'),
      theme: require('./src/theme/prism-light-theme-chialisp')
    },
    navbar: {
      title: 'Chialisp',
      logo: {
        alt: 'Chialisp Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
  //      {to: 'blog', label: 'Blog', position: 'left'},
        {
          href: 'https://chialisp.com/training', 
          label: 'Training', 
          position:'left'
        },
        {
          href: 'https://chia.net', 
          label: 'Chia.net', 
          position: 'left'
        },
        {
          href: 'https://github.com/Chia-Network/staging-chialisp-web',
          label: 'GitHub',
          position: 'left',
        }
      ],
      
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'CLVM Basics',
              to: 'docs/',
            },
            {
              label: 'Coins, Spends and Wallets',
              to: 'docs/coins_spends_and_wallets/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Keybase',
              href: 'https://keybase.io/team/chia_network.public',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/chia_project',
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
        src: 'img/full_logo_white.svg',
        href: '/',
      },
      copyright: `Copyright © ${new Date().getFullYear()} Chia Network Inc. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/Chia-Network/staging-chialisp-web/edit/main/',
        },
//        blog: {
//          showReadingTime: true,
//          // Please change this to your repo.
//          editUrl:
//            'https://github.com/Chia-Network/chialisp-web/edit/main/blog/',
//        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  plugins: [
    // ... Your other plugins.
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        // ... Your options.
        // `hashed` is recommended as long-term-cache of index file is possible.
        hashed: true,
        // For Docs using Chinese, The `language` is recommended to set to:
        // will add zh in when translations are ready
        // ```
        language: ["en"],
        // ```
        // When applying `zh` in language, please install `nodejieba` in your project.
      },
    ],
  ],
};
