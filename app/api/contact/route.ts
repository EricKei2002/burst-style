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
            from: 'Eric Kei <Contact@burst.style>',
            to: email,
            subject: 'Thank you for contacting Burst Style',
            html: `
                <!DOCTYPE html>
                <html>
                <body style="background-color: #000000; margin: 0; padding: 0; font-family: 'Courier New', monospace;">
                    <div style="background-color: #0a0a0a; color: #e4e4e7; padding: 40px 20px; text-align: center;">
                        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #333; border-radius: 12px; overflow: hidden; background-color: #111; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.1);">
                            
                            <!-- Header Image -->
                            <div style="width: 100%; height: 200px; background-image: url('https://burst.style/og-image.jpg'); background-size: cover; background-position: center; background-color: #222;">
                                <!-- Fallback for email clients that strip background images -->
                                <img src="https://burst.style/og-image.jpg" alt="Burst Style" style="width: 100%; height: 100%; object-fit: cover; opacity: 0;" />
                            </div>

                            <div style="padding: 40px 30px;">
                                <!-- Title -->
                                <h1 style="color: #22c55e; font-size: 24px; letter-spacing: -1px; margin: 0 0 20px 0; border-bottom: 2px solid #22c55e; display: inline-block; padding-bottom: 8px;">
                                    &gt; SYSTEM_MESSAGE_
                                </h1>

                                <!-- Greeting -->
                                <p style="font-size: 16px; line-height: 1.8; margin-bottom: 30px; text-align: left;">
                                    Hello <span style="color: #d946ef; font-weight: bold;">${name}</span>,<br><br>
                                    お問い合わせありがとうございます。<br>
                                    あなたのメッセージは <strong>BURST SYSTEM</strong> に正常に転送されました。<br>
                                    内容を確認の上、Eric Kei より直接ご連絡いたします。
                                </p>
                                
                                <!-- User Message -->
                                <div style="background-color: #000; padding: 20px; text-align: left; border-left: 4px solid #d946ef; margin-bottom: 30px; border-radius: 4px;">
                                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px;">&gt; Incoming Transmission:</p>
                                    <p style="margin: 0; white-space: pre-wrap; color: #e4e4e7; font-size: 14px;">${message}</p>
                                </div>

                                <!-- Footer -->
                                <p style="font-size: 14px; color: #a1a1aa; margin-top: 40px; border-top: 1px dashed #333; padding-top: 20px;">
                                    Wait for connection...
                                </p>
                                
                                <div style="margin-top: 30px; font-size: 12px; color: #52525b;">
                                    <p style="margin-bottom: 10px;">BURST STYLE | Eric Kei Portfolio</p>
                                    <a href="https://burst.style" style="color: #22c55e; text-decoration: none; border: 1px solid #22c55e; padding: 8px 16px; border-radius: 20px; display: inline-block;">Visit Website</a>
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
