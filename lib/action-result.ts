/**
 * Typed result for server actions so the UI can surface errors.
 * Use: return ActionResult.error("Something went wrong");
 * In the client: const result = await someAction(formData);
 *                if (!result.ok) showToast(result.error);
 */
export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export const ActionResult = {
  ok<T>(data?: T): ActionResult<T> {
    return { ok: true, data };
  },
  error(message: string): ActionResult<never> {
    return { ok: false, error: message };
  },
};
