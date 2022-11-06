module.exports = {
  someSidebar: [
    {
      type: 'link',
      label: 'Learn Chialisp',
      href: 'https://devs.chia.net/guides',
    },
    'intro',
    'commands',
    'syntax',
    'operators',
    'examples',
    'costs',
    'optimization',
    'debugging',
    {
      type: 'category',
      label: 'Primitives',
      items: [
        'primitives/standard-transactions',
        'primitives/singletons',
        'primitives/cats',
        'primitives/nfts',
        'primitives/dids',
        'primitives/offers',
        'primitives/pooling',
      ],
    },
    'clvm',
  ],
};
