export type ContactLocale = "en" | "ja";

export type ContactField = "name" | "email" | "message";

export const CONTACT_LIMITS = {
  nameMin: 1,
  nameMax: 120,
  emailMax: 254,
  messageMin: 1,
  messageMax: 5000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function msg(
  locale: ContactLocale,
  en: string,
  ja: string,
): string {
  return locale === "ja" ? ja : en;
}

export type ValidatedContactFields = {
  name: string;
  email: string;
  message: string;
  locale: ContactLocale;
};

export type ContactValidationResult =
  | { ok: true; data: ValidatedContactFields }
  | { ok: false; fieldErrors: Partial<Record<ContactField, string>> };

export function parseContactLocale(raw: string | null | undefined): ContactLocale {
  return raw === "ja" ? "ja" : "en";
}

export function validateContactForm(input: {
  name: string;
  email: string;
  message: string;
  locale: ContactLocale;
}): ContactValidationResult {
  const locale = input.locale;
  const fieldErrors: Partial<Record<ContactField, string>> = {};

  const name = input.name.trim();
  if (name.length < CONTACT_LIMITS.nameMin) {
    fieldErrors.name = msg(
      locale,
      "Please enter your name.",
      "お名前を入力してください。",
    );
  } else if (name.length > CONTACT_LIMITS.nameMax) {
    fieldErrors.name = msg(
      locale,
      `Name must be at most ${CONTACT_LIMITS.nameMax} characters.`,
      `お名前は${CONTACT_LIMITS.nameMax}文字以内で入力してください。`,
    );
  }

  const email = input.email.trim();
  if (email.length === 0) {
    fieldErrors.email = msg(
      locale,
      "Please enter your email address.",
      "メールアドレスを入力してください。",
    );
  } else if (email.length > CONTACT_LIMITS.emailMax) {
    fieldErrors.email = msg(
      locale,
      "Email address is too long.",
      "メールアドレスが長すぎます。",
    );
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = msg(
      locale,
      "Please enter a valid email address.",
      "有効なメールアドレスを入力してください。",
    );
  }

  const message = input.message.trim();
  if (message.length < CONTACT_LIMITS.messageMin) {
    fieldErrors.message = msg(
      locale,
      "Please enter your message.",
      "お問い合わせ内容を入力してください。",
    );
  } else if (message.length > CONTACT_LIMITS.messageMax) {
    fieldErrors.message = msg(
      locale,
      `Message must be at most ${CONTACT_LIMITS.messageMax} characters.`,
      `本文は${CONTACT_LIMITS.messageMax}文字以内で入力してください。`,
    );
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: { name, email, message, locale },
  };
}