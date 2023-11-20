import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docSidebar: [
    {
      type: 'category',
      label: 'v1.x',
      items: [
        'v1.x/introduction',
        'v1.x/installation',
        'v1.x/primitives',
        'v1.x/cli',
        'v1.x/contracts',
        'v1.x/circuits',
        'v1.x/trusted-setup',
        'v1.x/testing',
        'v1.x/integrating',
        'v1.x/audit',
        'v1.x/ci-pipeline',
        'v1.x/release',
        'v1.x/troubleshooting'
      ]
    },
    {
      type: 'category',
      label: 'v0.x',
      items: [
        'v0.x/introduction',
        'v0.x/contract',
        'v0.x/circuits',
        'v0.x/state_root_transition_circuit',
        'v0.x/quadratic_vote_tallying_circuit',
        'v0.x/faq'
      ]
    }
  ],
}

export default sidebars;
