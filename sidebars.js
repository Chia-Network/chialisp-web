module.exports = {
    someSidebar: [
        {
            'Getting Started': [
                'getting_started/intro_to_chialisp',
                'getting_started/setting_up_testnet',
                'getting_started/first_smart_coin',
            ],
            Chialisp: [
                'high_level_lang',
                'intro_chialisp_puzzles',
                'common_functions',
                'coin_lifecycle',
                'security',
                'debugging',
                'optimization',
                'standard_transaction',
                {
                    'Standard Puzzles': [
                        'puzzles/singletons',
                        'puzzles/pooling',
                        'puzzles/cats',
                        'puzzles/offers',
                    ],
                },
            ],

            Tutorials: [
                {
                    'Chialisp Tutorial Video Series': [
                        'tutorials/why_chia_is_great',
                        'tutorials/developing_applications',
                        'tutorials/tools_and_setup',
                        'tutorials/programming_chialisp',
                        'tutorials/coin_lifecycle_and_testing',
                        'tutorials/singletons',
                        'tutorials/high-level-tips-1',
                        'tutorials/high-level-tips-2',
                        'tutorials/high-level-tips-3',
                        'tutorials/single_issuance_CAT',
                    ],
                },
                'tutorials/custom_puzzle_lock',
                'tutorials/coin_spend_rpc',
                'tutorials/structure_of_a_chia_application',
                'tutorials/CAT_Launch_Process_Linux_MacOS',
                'tutorials/CAT_Launch_Process_Windows',

                'tutorials/multiple_issuance_CAT',
                'tutorials/offers_gui_tutorial',
                'tutorials/offers_cli_tutorial',
            ],
            CLVM: [
                'clvm/basics',
                'clvm/coins_spends_and_wallets',
                'clvm/dive_into_clvm',
                'clvm/lang_reference',
                'clvm/serialization',
            ],
        },
        'glossary',
        'faq',
        'resources',
    ],
};
