import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user: "no.reply.schedulesync@gmail.com",
        pass: "fdsz plni veev nljf"
    }
})

export async function sendOtpEmail(toEmail,otpCode){
    return transporter.sendMail({
        from: "no.reply.schedulesync@gmail.com",
        to: toEmail,
        subject: "Reset your password",
        text : `Hi user,
         To reset your password for ScheduleSync, please enter this OTP: ${otpCode}.
         It will expires in 5 minutes.

         Thanks!`
    })
}