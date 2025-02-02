'use server';

import bcrypt from "bcrypt";
import { db } from "@vercel/postgres";
import { SignJWT } from "jose";
import { User, UserCookie, Token } from "@/app/lib/definitions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData): Promise<{user: User | null, error: string}> {
  const client = await db.connect();
  const name = formData.get("name") as string;
  const year = formData.get("year") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const key = formData.get("key") as string;
  const hashedPassword = await bcrypt.hash(password, 10);
  const role = "user";

  if (key !== process.env.SIGNUP_KEY) {
    console.log('Entered signup key check failed');
    return { user: null, error: "CLAVE INCORRECTA" };
  }

  const tokens = await client.sql<Token>`SELECT * FROM githubtokens`;

  const tokensArray = tokens.rows.filter((token) => {
    return !token.assigned
  });

    
  if (tokensArray.length === 0) {
    return { user: null, error: "LIMITE DE USUARIOS EXCEDIDO" };
  }
  const githubtoken = tokensArray[0].githubtoken;

  const user = await client
    .sql<User>`INSERT INTO users (name, role, year, email, password, assignedgithubtoken) VALUES (${name}, ${role}, ${year}, ${email}, ${hashedPassword}, ${githubtoken}) RETURNING *`
    .then((res) => res.rows[0]);
  
  if (!user) {
  return { user: null, error: "NO SE PUDO REGISTRAR EL USUARIO" };
  }
  return {user, error: ""};
}

export async function increaseLoginCount(user: User) {
  const response = await fetch(process.env.BASE_URL as string + '/api/user/', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify({ logincount: user.logincount + 1 }),
  })
  const updatedUser: User = await response.json();
  return updatedUser
}

export async function setCookie(user: User) {

  if (!user) {
    throw new Error("UNEXPECTED_ERROR");
  }
  console.log('issuer', process.env.JWT_ISSUER)
  console.log('audience', process.env.JWT_AUDIENCE)
  let token: string;
  try {
    token = await new SignJWT({ id: user?.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .setIssuer(process.env.JWT_ISSUER as string)
    .setAudience(process.env.JWT_AUDIENCE as string)
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  } catch (error) {
    return "UNEXPECTED_ERROR";
  }

  const session: UserCookie = {
    id: user?.id,
    token: token,
    logincount: user?.logincount,
    githubtoken: user?.assignedgithubtoken
  }

  console.log('after creating cookie: ', session)
  
  cookies().set('session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // One week
    path: '/',
  });
}


export async function signIn(formData: FormData): Promise<string> {
  const client = await db.connect();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await client
    .sql<User>`SELECT * FROM users WHERE email = ${email}`
    .then((res) => res.rows[0])

  if (!user) {
    return "Email incorrecto";
  }

  const hashedPassword = user?.password;

  const isPasswordValid = await bcrypt.compare(password, hashedPassword);

  if (!isPasswordValid) {
    return "Contraseña incorrecta";
  }
  
  await setCookie(user);
  
  if (user.logincount === 0) {
    redirect('/initial-setup');
  }
  await increaseLoginCount(user);
  redirect('/gemif/main');
}

export async function signOut(): Promise<string> {
  try {
    cookies().delete('session');
  } catch (error) {
  return "NO_SESSION_TO_DELETE";
  }
  redirect('/login');
}