export const arcjetProtection = async (req, res, next) => {
  // 🔓 Allow auth routes
  if (req.path.startsWith("/api/auth")) {
    return next();
  }

  // 🔓 Allow development environment
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return res.status(429).json({
          message: "Rate limit exceeded. Please try again later.",
        });
      }

      if (decision.reason.isBot()) {
        return res.status(403).json({ message: "Bot access denied." });
      }

      return res.status(403).json({
        message: "Access denied by security policy.",
      });
    }

    if (decision.results.some(isSpoofedBot)) {
      return res.status(403).json({
        message: "Malicious bot activity detected.",
      });
    }

    next();
  } catch (error) {
    console.error("Arcjet Protection Error:", error);
    next();
  }
};
