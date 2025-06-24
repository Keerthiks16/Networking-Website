import jwt from "jsonwebtoken";
export const generateToken = (userId, res) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.cookie("jwt-networking-token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "strict",
    });
  } catch (error) {
    console.log(`Error in generating token: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};
