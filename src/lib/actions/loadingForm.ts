import { enhance } from '$app/forms';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';

export type LoadingFormOptions = {
	/** Existing enhance handler to keep running alongside the loading state. */
	handler?: SubmitFunction;
};

/**
 * Svelte action that prevents double submissions (login, account creation,
 * deletions, ...) by disabling the form's submit buttons and showing a
 * loading spinner on every request.
 *
 * - With a `handler`, it wraps `enhance` (client-side submission) and runs
 *   your existing logic.
 * - Without a `handler`, it keeps the native form submission (full page
 *   navigation/redirect) and only disables the buttons while submitting.
 *
 * Usage:
 *   <form use:loadingForm>…</form>
 *   <form use:loadingForm={{ handler: () => { … } }}>…</form>
 */
export function loadingForm(node: HTMLFormElement, options: LoadingFormOptions = {}) {
	if (options.handler) {
		const submit: SubmitFunction = (input) => {
			setLoading(node, true);
			const inner = options.handler?.(input);
			return async (response) => {
				if (inner) {
					const callback = await inner;
					if (typeof callback === 'function') {
						await callback(response);
					}
				}
				setLoading(node, false);
			};
		};

		return enhance(node, submit);
	}

	// No handler: keep the native submission and just disable buttons to
	// prevent double-clicks. The page navigates away, so no reset is needed.
	const onSubmit = (event: SubmitEvent) => {
		if (event.defaultPrevented) return;
		setLoading(node, true);
	};

	node.addEventListener('submit', onSubmit);

	return {
		destroy() {
			node.removeEventListener('submit', onSubmit);
		}
	};
}

function setLoading(form: HTMLFormElement, loading: boolean) {
	const buttons = form.querySelectorAll<HTMLButtonElement>(
		'button[type="submit"], button:not([type])'
	);
	buttons.forEach((btn) => {
		btn.disabled = loading;
		if (loading) {
			btn.setAttribute('data-loading', 'true');
		} else {
			btn.removeAttribute('data-loading');
		}
	});

	const inputs = form.querySelectorAll<HTMLInputElement>('input[type="submit"]');
	inputs.forEach((input) => {
		input.disabled = loading;
	});
}
