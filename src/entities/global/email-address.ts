import type { EntityDefinition } from '../../core/types';

export const EMAIL_ADDRESS: EntityDefinition = {
  name: 'EMAIL_ADDRESS',
  description: 'Email address',
  patterns: [
    {
      name: 'email',
      regex: String.raw`\b((([!#$%&'*+\-/=?^_\`{|}~\w])|([!#$%&'*+\-/=?^_\`{|}~\w][!#$%&'*+\-/=?^_\`{|}~\.\w]{0,}[!#$%&'*+\-/=?^_\`{|}~\w]))[@]\w+(?:-+\w+)*(?:\.\w+(?:-+\w+)*)+)\b`,
      score: 0.5,
    },
  ],
  // Upstream resolves the domain against a real suffix list. Without that
  // list this can only reject a shape no domain has, so it is a filter.
  validation: {
    kind: 'filter',
    run: (value) => {
      const domain = value.split('@').at(-1) ?? '';
      return /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)
        ? null
        : false;
    },
  },
  context: ['email', 'correo', 'e-mail', 'mail'],
};
