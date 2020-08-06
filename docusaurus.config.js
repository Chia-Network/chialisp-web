module.exports = {
  title: 'Chialisp',
  tagline: 'Developing with Chialisp',
  url: 'https://chialisp.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'img/favicon.ico',
  organizationName: 'Chia-Network', // Usually your GitHub org/user name.
  projectName: 'chialisp-web', // Usually your repo name.
  themeConfig: {
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
          href: 'https://github.com/Chia-Network/chialisp-web',
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
              label: 'CLVM Basics',
              to: 'docs/',
            },
            {
              label: 'Coins, Spends and Wallets',
              to: 'docs/doc2/',
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
      copyright: `Copyright © ${new Date().getFullYear()} Chia Network Inc. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          homePageId: 'doc1',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/Chia-Network/chialisp-web/edit/master/',
        },
//        blog: {
//          showReadingTime: true,
//          // Please change this to your repo.
//          editUrl:
//            'https://github.com/Chia-Network/chialisp-web/edit/master/blog/',
//        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
