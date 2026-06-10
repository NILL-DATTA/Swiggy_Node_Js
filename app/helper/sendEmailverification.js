const nodemailer = require("nodemailer");

const otpSchema = require("../model/otpmodel");

const sendEmailverificationOtp = async (user) => {
  try {
    if (!user || !user._id || !user.email) {
      throw new Error("Invalid user object");
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await otpSchema.deleteMany({ userId: user._id.toString() });
    const saved = await new otpSchema({
      userId: user._id.toString(),
      otp,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    }).save();

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL || "sagnikduttaimps@gmail.com",
        pass: process.env.SMTP_PASSWORD || "pqzp nzoo qgpj wlie",
      },
    });
    const mailOptions = {
      from: `"YourApp" <${process.env.SMTP_EMAIL || "sagnikduttaimps@gmail.com"}>`,
      to: user.email,
      subject: "Your OTP Code",
      html: `
        <p>Hello ${user.full_name}</p>
        <p>Your OTP code is:</p>
        <h2>${otp}</h2>
        <p>This OTP is valid for 1 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(" OTP Email sent to:", user);

    return saved;
  } catch (err) {
    console.error(" Failed to send OTP:", err);
    throw err;
  }
};

module.exports = sendEmailverificationOtp;
