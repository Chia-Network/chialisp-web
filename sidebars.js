module.exports = {
  someSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Chialisp Primer',
      collapsible: true,
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/chialisp-primer',
        title: 'Chialisp Primer',
        description:
          'This guide will teach you the basics of Chialisp, a smart coin language used on the Chia blockchain. You will learn the skills required to write basic programs that can dictate how and when coins (including XCH) can be spent.',
      },
      items: [
        'chialisp-primer/intro',
        'chialisp-primer/using-modules',
        'chialisp-primer/testnet-setup',
        'chialisp-primer/first-smart-coin',
        'chialisp-primer/bls-signatures',
      ],
    },
    {
      type: 'category',
      label: 'Chialisp Concepts',
      collapsible: true,
      collapsed: true,
      link: {
        type: 'generated-index',
        slug: '/chialisp-concepts',
        title: 'Chialisp Concepts',
        description:
          'This guide introduces some key Chialisp concepts. Understanding these concepts will enable you to write Chialisp programs more easily.',
      },
      items: [
        'chialisp-concepts/currying',
        'chialisp-concepts/inner-puzzles',
        'chialisp-concepts/condition-morphing',
      ],
    },

    'commands',
    'syntax',
    'modern-chialisp',
    'operators',
    'examples',
    'costs',
    'conditions',
    'optimization',
    'common_issues',
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
