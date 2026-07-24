// Shared props for email-address inputs. `type="email"` brings up the email
// keyboard on mobile; the rest disable auto-capitalization, autocorrect, and
// spellcheck (DMCN addresses are email-formatted: local@domain, and the first
// letter must not be capitalized).
export const emailInputProps = {
  type: 'email',
  inputMode: 'email' as const,
  autoCapitalize: 'none',
  autoCorrect: 'off',
  spellCheck: false,
};
