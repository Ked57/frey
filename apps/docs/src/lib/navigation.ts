export interface NavItem {
  title: string;
  href: string;
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
  },
  {
    title: 'Entity Configuration',
    href: '/docs/entity-configuration',
  },
  {
    title: 'Custom Routes',
    href: '/docs/custom-routes',
  },
  {
    title: 'Parameter Handling',
    href: '/docs/parameter-handling',
  },
  {
    title: 'Type Safety',
    href: '/docs/type-safety',
  },
  {
    title: 'API Reference',
    href: '/docs/api-reference',
  },
  {
    title: 'Examples',
    href: '/docs/examples',
  },
];
