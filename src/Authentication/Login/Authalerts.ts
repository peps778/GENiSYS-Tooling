import Swal from 'sweetalert2';

/**
 * GENiSYS SweetAlert configuration.
 *
 * The styling intentionally follows the existing application
 * branding: emerald accents, white surfaces, compact typography,
 * and restrained borders/shadows.
 */
const swalTheme = {
  customClass: {
    popup: 'rounded-2xl border border-emerald-900/10 shadow-xl',
    title: 'text-lg font-bold text-green-950',
    htmlContainer: 'text-xs leading-6 text-slate-500',
    confirmButton:
      'rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white',
    cancelButton:
      'rounded-lg border border-emerald-900/10 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600',
  },
  buttonsStyling: false,
  background: '#ffffff',
};

/** Displays a branded authentication error and logs technical context. */
export async function showAuthError(
  title: string,
  message: string,
  technicalContext?: string,
): Promise<void> {
  console.error(`[GENiSYS Auth] ${technicalContext ?? title}: ${message}`);

  await Swal.fire({
    ...swalTheme,
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Try Again',
  });
}

/** Displays a branded informational message. */
export async function showAuthInfo(
  title: string,
  message: string,
): Promise<void> {
  await Swal.fire({
    ...swalTheme,
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'OK',
  });
}

/** Displays a branded success message. */
export async function showAuthSuccess(
  title: string,
  message: string,
): Promise<void> {
  await Swal.fire({
    ...swalTheme,
    icon: 'success',
    title,
    text: message,
    confirmButtonText: 'Continue',
  });
}
