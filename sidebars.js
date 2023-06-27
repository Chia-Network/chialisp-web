module.exports = {
  someSidebar: [
    {
      type: 'link',
      label: 'Learn Chialisp',
      href: 'https://docs.chia.net/guides',
    },
    'intro',
    'commands',
    'syntax',
    'modern_chialisp',
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
