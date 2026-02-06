import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

// Send email via SMTP (nodemailer)
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("[Email] SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS)")
      return false
    }

    console.log("[Email] Attempting to send email to:", options.to)

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    console.log(`[Email] Successfully sent to ${options.to}`, info.messageId)
    return true
  } catch (error) {
    console.error("[Email] Failed to send:", error)
    if (error instanceof Error) {
      console.error("[Email] Error message:", error.message)
    }
    return false
  }
}

// Password reset email template
export function getPasswordResetEmailHtml(name: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Reset Kata Sandi</title>
  <style>
    :root { color-scheme: light only; }
    @media (prefers-color-scheme: dark) {
      .email-header { background: #538297 !important; }
      .email-header h1 { color: #ffffff !important; }
      .email-header p { color: #ffffff !important; }
      .email-btn { background: #538297 !important; color: #ffffff !important; }
      .email-body { background-color: #ffffff !important; }
      .email-wrapper { background-color: #f5f5f5 !important; }
      .email-card { background-color: #ffffff !important; }
      .email-footer { background-color: #f9fafb !important; }
      .text-dark { color: #374151 !important; }
      .text-mid { color: #6b7280 !important; }
      .text-light { color: #9ca3af !important; }
      .text-link { color: #538297 !important; }
    }
  </style>
</head>
<body class="email-wrapper" style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table class="email-card" role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td class="email-header" style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #538297 0%, #2C4F63 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">AMP MBG</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px;">Atur Ulang Kata Sandi</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="padding: 40px; background-color: #ffffff;">
              <p class="text-dark" style="margin: 0 0 20px; color: #374151; font-size: 16px;">Halo <strong>${name}</strong>,</p>
              <p class="text-mid" style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Kami menerima permintaan untuk mengatur ulang kata sandi akun AMP MBG Anda.
                Klik tombol di bawah ini untuk membuat kata sandi baru:
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a class="email-btn" href="${resetUrl}"
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #538297 0%, #2C4F63 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
                      Atur Ulang Kata Sandi
                    </a>
                  </td>
                </tr>
              </table>

              <p class="text-mid" style="margin: 20px 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                Tautan ini akan kedaluwarsa dalam <strong>1 jam</strong>.
                Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini.
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

              <p class="text-light" style="margin: 0; color: #9ca3af; font-size: 12px;">
                Jika tombol tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:
              </p>
              <p class="text-link" style="margin: 8px 0 0; color: #538297; font-size: 12px; word-break: break-all;">
                ${resetUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center;">
              <p class="text-light" style="margin: 0; color: #9ca3af; font-size: 12px;">
                &copy; 2024 AMP MBG. Semua hak dilindungi.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
