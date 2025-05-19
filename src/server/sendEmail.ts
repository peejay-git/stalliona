import nodemailer from "nodemailer";

export const sendMail = async (
    talentEmail: string,
    sponsorEmail: string,
    firstName: string
): Promise<void> => {
    try {
        console.log(talentEmail, sponsorEmail, firstName);
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_EMAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        // **1️⃣ Email to the user**
        let talentMailOptions = {
            from: `"Stallion Team" <${process.env.ADMIN_EMAIL}>`,
            to: talentEmail,
            subject: "Your Submission Confirmation - Winning Numbers Inside!",
            html: `
        <h3>Hello ${firstName},</h3>
        <p>Thank you for submitting your information. Below are your unique details:</p>
       
        <p>We appreciate your participation.</p>
        <p>Best Regards,</p>
        <p><strong>Stallion Team</strong></p>
        <p>-----------------------------------------------------------------------------------------</p>
        <p>Email: <a href="mailto:info@email.org" style="color: #084b8b; text-decoration: none;">info@email.org</a></p>
      `,
        };

        await transporter.sendMail(talentMailOptions);
        console.log("📩 Email sent successfully to user:", talentEmail);

        // **2️⃣ Email to Admin (`info@admin.org`)**
        let sponsorMailOptions = {
            from: `"Stallion System" <${process.env.ADMIN_EMAIL}>`,
            to: sponsorEmail,
            subject: `New Bounty Submission: ${firstName}`,
            html: `
       
      `,
        };

        await transporter.sendMail(sponsorMailOptions);
        console.log(
            "📩 Bounty details sent successfully to Sponsor"
        );
    } catch (error) {
        console.error("❌ Email Sending Error:", error);
    }
};