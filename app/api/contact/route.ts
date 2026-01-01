import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    // 1. Forward to Formspree (Admin Notification)
    // We forward the form data exactly as received
    const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT;
    
    if (formspreeEndpoint) {
        // Send to Formspree, but don't fail the whole request if it fails (optional strategy, but safer to try both)
        await fetch(formspreeEndpoint, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        }).catch(err => console.error("Formspree error:", err));
    }

    // 2. Send Auto-reply via Resend
    if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
            from: 'Eric Kei <noreply@burst.style>',
            to: email,
            subject: 'Thank you for contacting Burst Style',
            html: `
                <div style="font-family: monospace; color: #333; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #d946ef;">Transmission Received</h1>
                    <p>Hello ${name},</p>
                    <p>お問い合わせありがとうございます。以下の内容でメッセージを受け付けました。</p>
                    <hr style="border: 1px dashed #ccc; margin: 20px 0;">
                    <p style="white-space: pre-wrap; background: #f4f4f5; padding: 15px; border-radius: 8px;">${message}</p>
                    <hr style="border: 1px dashed #ccc; margin: 20px 0;">
                    <p>内容を確認次第、改めてご連絡いたします。</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #888;">
                        Best regards,<br>
                        <strong>Eric Kei @ Burst Style</strong>
                    </p>
                </div>
            `,
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
