"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const slideUp = {
  hidden: { y: 28, opacity: 0 },
  visible: (d: number = 0) => ({
    y: 0,
    opacity: 1,
    transition: { ease: [0.22, 1, 0.36, 1] as const, duration: 0.5, delay: d },
  }),
};

type Status = "idle" | "sending" | "success" | "error";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to send message.",
      );
    }
  };

  return (
    <section id="contact" className="contact-root">
      <div className="contact-inner">
        <motion.p
          className="contact-label"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
        >
          Get in touch
        </motion.p>

        <motion.h2
          className="contact-heading"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0.1}
        >
          {"Let's work together"}
        </motion.h2>

        <motion.p
          className="contact-subtext"
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0.2}
        >
          Have a project in mind or just want to say hi? Drop a message and{" "}
          {"I'll"} get back to you as soon as possible.
        </motion.p>

        <motion.form
          className="contact-form"
          onSubmit={(e) => void handleSubmit(e)}
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0.3}
          noValidate
        >
          <div className="contact-field">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              type="text"
              className="contact-input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={status === "sending"}
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              className="contact-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "sending"}
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              className="contact-textarea"
              placeholder="Tell me about your project..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={status === "sending"}
            />
          </div>

          {status === "success" && (
            <p className="contact-status contact-status--success">
              Message sent! I will be in touch soon.
            </p>
          )}

          {status === "error" && (
            <p className="contact-status contact-status--error">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="contact-submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending..." : "Send message"}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
