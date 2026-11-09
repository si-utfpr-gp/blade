/**
 * The CSRF token Rails puts in the layout. Reading it here means the header's
 * logout form and the API client cannot drift apart on how the token is found.
 */
export function csrfToken(): string {
  return (
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
      ?.content ?? ""
  )
}