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
            replyTo: 'yamamotokei587@gmail.com',
            subject: 'Thank you for contacting Burst Style',
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; color: #e4e4e7; background-color: #030014;">
                    <!-- Outer Container with Starry/Space Background -->
                    <div style="background: radial-gradient(circle at center, #2e1065 0%, #020617 80%); padding: 40px 20px; text-align: center; min-height: 100vh;">
                        
                        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ffffff20; border-radius: 16px; overflow: hidden; background-color: rgba(10, 10, 10, 0.9); backdrop-filter: blur(10px); box-shadow: 0 0 50px rgba(124, 58, 237, 0.3);">
                            
                            <!-- Header / Icon Area -->
                            <div style="padding: 40px 0 20px 0; background: linear-gradient(to bottom, rgba(124, 58, 237, 0.2), transparent); position: relative;">
                                <img src="https://burst.style/icon.jpg" alt="Eric Kei" style="width: 100px; height: 100px; border-radius: 50%; border: 2px solid #22c55e; box-shadow: 0 0 30px rgba(34, 197, 94, 0.6); object-fit: cover;" />
                            </div>

                            <div style="padding: 20px 30px 20px 30px; text-align: left;">
                                <!-- Terminal Header -->
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <h1 style="color: #22c55e; font-size: 24px; letter-spacing: 1px; margin: 0; text-shadow: 0 0 15px rgba(34, 197, 94, 0.6);">
                                        SYSTEM_BOOT_SEQUENCE<span style="animation: blink 1s infinite;">_</span>
                                    </h1>
                                    <p style="color: #a78bfa; font-size: 14px; margin: 8px 0 0 0; letter-spacing: 2px;">CONNECTION ESTABLISHED</p>
                                </div>

                                <!-- Greeting -->
                                <p style="font-size: 15px; line-height: 1.8; margin-bottom: 20px; color: #e4e4e7; text-align: center;">
                                    Hello <span style="color: #22c55e; font-weight: bold;">${name}</span>,<br>
                                    お問い合わせありがとうございます。<br>
                                    あなたのメッセージは <strong style="color: #d946ef;">BURST STYLE</strong> に正常に転送されました。<br>
                                    Eric Kei より直接ご連絡いたします。
                                </p>
                                
                                <!-- User Message Box (Glass-like Terminal) -->
                                <div style="background-color: rgba(0, 0, 0, 0.6); border: 1px solid #333; border-radius: 8px; padding: 25px; margin-bottom: 20px; font-size: 13px; position: relative;">
                                    <div style="color: #888; font-size: 11px; margin-bottom: 15px; border-bottom: 1px solid #ffffff20; padding-bottom: 10px; display: flex; align-items: center;">
                                        <span style="color: #d946ef; margin-right: 10px; font-size: 14px;">➜</span>
                                        <span style="letter-spacing: 1px;">INPUT_TRANSMISSION</span>
                                    </div>
                                    <p style="margin: 0; white-space: pre-wrap; color: #ccc; line-height: 1.6;">${message}</p>
                                </div>

                                <!-- Footer -->
                                <div style="border-top: 1px solid #ffffff10; padding-top: 20px; margin-top: 20px; text-align: center;">
                                    <p style="font-size: 12px; color: #666; margin-bottom: 15px;">Wait for connection...</p>
                                    
                                    <a href="https://burst.style" style="color: #e4e4e7; text-decoration: none; font-size: 12px; border: 1px solid #ffffff20; padding: 10px 24px; border-radius: 30px; background: rgba(255,255,255,0.05); transition: all 0.2s;">
                                        <span style="color: #22c55e;">●</span> Return to Universe
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
            `,
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
