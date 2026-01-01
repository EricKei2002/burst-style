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
            from: 'Contact@burst.style',
            to: email,
            subject: 'Thank you for contacting Burst Style',
            html: `
                <!DOCTYPE html>
                <html>
                <body style="background-color: #000000; margin: 0; padding: 0; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; color: #e4e4e7;">
                    <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
                        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #333; border-radius: 8px; overflow: hidden; background-color: #0a0a0a; box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);">
                            
                            <!-- Header Image -->
                            <div style="width: 100%; height: 200px; background-image: url('https://burst.style/og-image.jpg'); background-size: cover; background-position: center; border-bottom: 1px solid #333;">
                                <img src="https://burst.style/og-image.jpg" alt="Burst Style" style="width: 100%; height: 100%; object-fit: cover; opacity: 0;" />
                            </div>

                            <div style="padding: 40px 30px; text-align: left;">
                                <!-- Terminal Header -->
                                <div style="margin-bottom: 30px; border-bottom: 1px dashed #333; padding-bottom: 20px;">
                                    <h1 style="color: #22c55e; font-size: 20px; letter-spacing: -0.5px; margin: 0;">
                                        <span style="color: #d946ef;">&gt;</span> SYSTEM_BOOT_SEQUENCE<span style="animation: blink 1s infinite;">_</span>
                                    </h1>
                                    <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">STATUS: CONFIRMED</p>
                                </div>

                                <!-- Greeting -->
                                <p style="font-size: 15px; line-height: 1.8; margin-bottom: 30px; color: #e4e4e7;">
                                    Hello <span style="color: #22c55e; font-weight: bold;">${name}</span>,<br><br>
                                    お問い合わせありがとうございます。<br>
                                    あなたのメッセージは <strong style="color: #d946ef;">BURST STYLE</strong> に正常に転送されました。<br>
                                    内容を確認の上、Eric Kei より直接ご連絡いたします。
                                </p>
                            
                                <!-- User Message Box (Terminal Style) -->
                                <div style="background-color: #111; border: 1px solid #333; border-radius: 4px; padding: 20px; margin-bottom: 30px; font-size: 13px;">
                                    <div style="color: #888; font-size: 11px; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 10px; display: flex;">
                                        <span style="color: #d946ef; margin-right: 10px;">➜</span>
                                        <span>INPUT_TRANSMISSION</span>
                                    </div>
                                    <p style="margin: 0; white-space: pre-wrap; color: #ccc; line-height: 1.6;">${message}</p>
                                </div>

                                <!-- Footer -->
                                <div style="border-top: 1px dashed #333; padding-top: 20px; margin-top: 40px; text-align: center;">
                                    <p style="font-size: 12px; color: #666; margin-bottom: 5px;">Wait for connection...</p>
                                    <div style="margin-top: 20px;">
                                        <a href="https://burst.style" style="color: #e4e4e7; text-decoration: none; font-size: 12px; border: 1px solid #333; padding: 8px 16px; border-radius: 4px; background: #000;">
                                            <span style="color: #22c55e;">&gt;</span> Return to Website
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
