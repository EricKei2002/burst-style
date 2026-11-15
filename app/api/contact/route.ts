import { NextResponse } from "next/server";
import { Resend } from "resend";
import { parseContactLocale, validateContactForm } from "./validateContactForm";

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function autoReplyHtml(
  locale: "en" | "ja",
  name: string,
  message: string,
): string {
  const safeName = escapeHtml(name);
  const safeMessage = escapeHtml(message);

  const bodyPara =
    locale === "ja"
      ? `
                                <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #e4e4e7; text-align: center;">
                                    Hello <span style="color: #22c55e; font-weight: bold;">${safeName}</span>,<br>
                                    お問い合わせありがとうございます。<br>
                                    あなたのメッセージは <strong style="color: #d946ef;">BURST STYLE</strong> に正常に転送されました。<br>
                                    Eric Kei より直接ご連絡いたします。
                                </p>`
      : `
                                <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #e4e4e7; text-align: center;">
                                    Hello <span style="color: #22c55e; font-weight: bold;">${safeName}</span>,<br>
                                    Thank you for contacting Burst Style.<br>
                                    Your message was delivered to <strong style="color: #d946ef;">BURST STYLE</strong> successfully.<br>
                                    Eric Kei will follow up with you directly.
                                </p>`;

  const footerWait =
    locale === "ja" ? "接続をお待ちください…" : "Wait for connection...";

  const footerBtn = locale === "ja" ? "宇宙に戻る" : "Return to Universe";

  return `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; color: #e4e4e7; background-color: #030014;">
                    <div style="background: radial-gradient(circle at center, #2e1065 0%, #020617 80%); padding: 40px 20px; text-align: center; min-height: 100vh;">
                        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ffffff20; border-radius: 16px; overflow: hidden; background-color: rgba(10, 10, 10, 0.9); backdrop-filter: blur(10px); box-shadow: 0 0 50px rgba(124, 58, 237, 0.3);">
                            <div style="padding: 40px 0 20px 0; background: linear-gradient(to bottom, rgba(124, 58, 237, 0.2), transparent); position: relative;">
                                <img src="https://www.burst.style/icon.jpg" alt="Eric Kei" style="width: 100px; height: 100px; border-radius: 50%; border: 2px solid #22c55e; box-shadow: 0 0 30px rgba(34, 197, 94, 0.6); object-fit: cover;" />
                            </div>
                            <div style="padding: 20px 30px 20px 30px; text-align: left;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <h1 style="color: #22c55e; font-size: 24px; letter-spacing: 1px; margin: 0; text-shadow: 0 0 15px rgba(34, 197, 94, 0.6);">
                                        SYSTEM_BOOT_SEQUENCE<span style="animation: blink 1s infinite;">_</span>
                                    </h1>
                                    <p style="color: #a78bfa; font-size: 14px; margin: 8px 0 0 0; letter-spacing: 2px;">CONNECTION ESTABLISHED</p>
                                </div>
                                ${bodyPara}
                                <div style="background-color: rgba(0, 0, 0, 0.6); border: 1px solid #333; border-radius: 8px; padding: 25px; margin-bottom: 20px; font-size: 13px; position: relative;">
                                    <div style="color: #888; font-size: 11px; margin-bottom: 15px; border-bottom: 1px solid #ffffff20; padding-bottom: 10px; display: flex; align-items: center;">
                                        <span style="color: #d946ef; margin-right: 10px; font-size: 14px;">➜</span>
                                        <span style="letter-spacing: 1px;">INPUT_TRANSMISSION</span>
                                    </div>
                                    <p style="margin: 0; white-space: pre-wrap; color: #ccc; line-height: 1.6;">${safeMessage}</p>
                                </div>
                                <div style="border-top: 1px solid #ffffff10; padding-top: 20px; margin-top: 20px; text-align: center;">
                                    <p style="font-size: 12px; color: #666; margin-bottom: 15px;">${footerWait}</p>
                                    <a href="https://www.burst.style" style="color: #e4e4e7; text-decoration: none; font-size: 12px; border: 1px solid #ffffff20; padding: 10px 24px; border-radius: 30px; background: rgba(255,255,255,0.05); transition: all 0.2s;">
                                        <span style="color: #22c55e;">●</span> ${footerBtn}
                                    </a>
                                    <p style="margin-top: 20px; margin-bottom: 0; font-size: 10px; color: #444;">
                                        &copy; 2026 Eric Kei / Burst Style. All systems nominal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;
}

function deliveryErrorResponse(locale: "en" | "ja") {
  return NextResponse.json(
    {
      success: false,
      error:
        locale === "ja"
          ? "送信処理に失敗しました。しばらくしてからもう一度お試しください。"
          : "Failed to deliver your message. Please try again later.",
    },
    { status: 502 },
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const locale = parseContactLocale(formData.get("locale") as string | null);

    const validation = validateContactForm({
      name: (formData.get("name") as string) ?? "",
      email: (formData.get("email") as string) ?? "",
      message: (formData.get("message") as string) ?? "",
      locale,
    });

    if (!validation.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            locale === "ja"
              ? "入力内容に問題があります。"
              : "Please fix the highlighted fields.",
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, email, message } = validation.data;
    const turnstileToken = formData.get("cf-turnstile-response") as string;

    if (process.env.TURNSTILE_SECRET_KEY) {
      const verifyFormData = new FormData();
      verifyFormData.append("secret", process.env.TURNSTILE_SECRET_KEY);
      verifyFormData.append("response", turnstileToken ?? "");

      const turnstileResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: verifyFormData,
        },
      );

      const turnstileResult = await turnstileResponse.json();
      if (!turnstileResult.success) {
        console.error("Turnstile verification failed:", turnstileResult);
        return NextResponse.json(
          {
            success: false,
            error:
              locale === "ja"
                ? "セキュリティ確認に失敗しました。"
                : "Security check failed",
          },
          { status: 400 },
        );
      }
    }

    const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT;

    if (formspreeEndpoint) {
      const formspreeBody = new FormData();
      formspreeBody.append("name", name);
      formspreeBody.append("email", email);
      formspreeBody.append("message", message);
      formspreeBody.append("locale", locale);

      const formspreeResponse = await fetch(formspreeEndpoint, {
        method: "POST",
        body: formspreeBody,
        headers: {
          Accept: "application/json",
        },
      });

      if (!formspreeResponse.ok) {
        const detail = await formspreeResponse.text().catch(() => "");
        console.error(
          "Formspree error:",
          formspreeResponse.status,
          detail.slice(0, 500),
        );
        return deliveryErrorResponse(locale);
      }
    }

    if (process.env.RESEND_API_KEY) {
      // モジュール読み込み時に生成すると、キー未設定のビルド環境(CI)で
      // ページデータ収集中に "Missing API key" で落ちるため、送信時に生成する
      const resend = new Resend(process.env.RESEND_API_KEY);
      const subject =
        locale === "ja"
          ? "Burst Style — お問い合わせありがとうございます"
          : "Thank you for contacting Burst Style";

      const { error: resendError } = await resend.emails.send({
        from: "Eric Kei <Contact@burst.style>",
        to: email,
        replyTo: "yamamotokei587@gmail.com",
        subject,
        html: autoReplyHtml(locale, name, message),
      });

      if (resendError) {
        console.error("Resend error:", resendError);
        return deliveryErrorResponse(locale);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 },
    );
  }
}
