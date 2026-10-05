"use strict";

const nodemailer = require("nodemailer");
const path = require("path");

const MAIL_USER = process.env.MAIL_USER || "corrigimail@gmail.com";
const MAIL_PASS = process.env.MAIL_PASS || "uaxotyjjontjofkt";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

const LOGO_CID = "sacmag-logo";

function getLogoAttachment() {
  return {
    filename: "logo-sacmag.png",
    path: path.join(__dirname, "../controllers/logo.png"),
    cid: LOGO_CID,
  };
}

async function sendMail(options = {}) {
  return transporter.sendMail({
    from: options.from || `"Proveedores SACMAG" <${MAIL_USER}>`,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    html: options.html,
    text: options.text,
    attachments: [
      getLogoAttachment(),
      ...(options.attachments || []),
    ],
  });
}

module.exports = {
  transporter,
  sendMail,
  MAIL_FROM: `"Proveedores SACMAG" <${MAIL_USER}>`,
  LOGO_CID,
  getLogoAttachment,
};