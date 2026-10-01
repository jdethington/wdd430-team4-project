import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { MongoServerError } from "mongodb";

import { createUser, findUserByEmail } from "@/lib/users";
import { createSession } from "@/lib/session";

const SignupSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),

  email: z.string().trim().email("Please enter a valid email address."),

  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      return NextResponse.json(
        {
          error: "Please correct the highlighted fields.",
          errors: {
            name: fieldErrors.name?.[0] ?? "",
            email: fieldErrors.email?.[0] ?? "",
            password: fieldErrors.password?.[0] ?? "",
          },
        },
        { status: 400 },
      );
    }

    const { name, email, password } = result.data;

    const normalizedEmail = email.toLowerCase();

    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
          errors: {
            email: "An account with this email already exists.",
          },
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await createUser(name, normalizedEmail, hashedPassword);

    if (!user._id) {
      return NextResponse.json(
        { error: "Unable to create account." },
        { status: 500 },
      );
    }

    await createSession(user._id.toString());

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    // Handles a race condition where two requests attempt
    // to create the same email at nearly the same time.
    if (error instanceof MongoServerError && error.code === 11000) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
          errors: {
            email: "An account with this email already exists.",
          },
        },
        { status: 409 },
      );
    }

    console.error("Signup error:", error);

    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 },
    );
  }
}
