import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, name, message } = await req.json();
    console.log("Received message from:", email, name);

    // configure Nodemailer
    const transport = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // send email
    const mailOptions = {
      from: email,
      to: "ike4football@gmail.com",
      subject: `New message from ${email} - ${name}`,
      text: message,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return NextResponse.json({ message: "Email sent successfully", id: info.messageId });
  } catch (error) {
    console.error("[EMAIL_SEND_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to send email", details: (error as Error).message },
      { status: 500 }
    );
  }
}



// import { NextResponse } from "next/server";
// import nodemailer from "nodemailer";

// export async function POST(req: Request) {
//   const { email, name, message } = await req.json();
//   // console.log("Message body now recieved Good one", email, name, message);


//   // configure Nodemailer
//   const transpoprt = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // send email
//   const mailOptions = {
//     from: email,
//     to: "ike4football@gmail.com",
//     subject: `New message from ${email} - ${name}`,
//     text: message,
//   };

//   try {
//     await transpoprt.sendMail(mailOptions);
//     return NextResponse.json({ message: "Email sent" });
//   } catch (error) {
//     console.log("[CODE_ERROR]", error);
//     return new NextResponse("Internal error, Email not sent", { status: 500});
//   }
// }