'use server'

import { SignJWT } from "jose";
import { getUser } from "../user/actions";
import { normalizeEmptyStrings } from "../../utils";
import { usersPostSchema } from "./validation";
import { ApiResponse, ErrorCode, User, UserCookie } from "../../definitions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verify } from "crypto";
import { set, z } from "zod";



const ERROR_MESSAGES: Record<string, string> = {
  name: 'Nombre',
  year: 'Curso',
  email: 'Correo',
  confirmEmail: 'Confirmación de correo',
  password: 'Contraseña',
  confirmPassword: 'Confirmación de contraseña',
  key: 'Clave',
}
export async function addUser(formData: FormData): Promise<{ data: any | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[]}> {

  const inputRaw = {
    name: formData.get("name"),
    year: formData.get("year"),
    email: formData.get("email"),
    confirmEmail: formData.get("confirmEmail"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    key: formData.get("key"),
  };

  const input = normalizeEmptyStrings(inputRaw);

  const parsed = usersPostSchema.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return { data: null, error: 'Error de formato', errorCode: "BAD_REQUEST", details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message })) };
  }

  const { name, year, email, confirmEmail, password, confirmPassword, key } = parsed.data;
  
  if (email !== confirmEmail) {
    return { data: null, error: 'Los correos no coinciden', errorCode: "BAD_REQUEST", details: [] };
  }

  if (password !== confirmPassword) {
    return { data: null, error: 'Las contraseñas no coinciden', errorCode: "BAD_REQUEST", details: [] };
  }

  const role = "user";
  const payload = { name, year, email, confirmEmail, password, confirmPassword, key, role };

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/users', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify(payload), 
    });

  const resJson: ApiResponse = await response.json();

  if (!response.ok) {
    return { data: null, error: resJson.publicError?? 'Error al crear el usuario', errorCode: resJson.errorCode, details: resJson.details };
  }
  console.log(resJson)

  const verificationRes = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/send-verification-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify({ email }),
  })

  const verificationResJson: ApiResponse = await verificationRes.json();
  if (!verificationRes.ok) {
    return { data: null, error: verificationResJson.publicError?? 'Error al enviar el correo de verificación', errorCode: verificationResJson.errorCode, details: verificationResJson.details };
  }

  const registerCookie = await setTokenCookie({ user: resJson.data, token: verificationResJson.data, type: 'verify' });

  
  return { data: registerCookie, error: null, errorCode: null, details: [] };
}


export async function increaseLoginCount(user: User): Promise<{ data: User | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {
  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/user/', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookies().toString(),
    },
    body: JSON.stringify({ logincount: user.logincount + 1 }),
  })
  const resJson: ApiResponse = await response.json();
  if (!response.ok) {
    
    return { data: null, error: resJson.publicError??"Error al actualizar la información del usuario", errorCode: resJson.errorCode , details: resJson.details };
  }
  const updatedUser: User = resJson.data;
  return { data: updatedUser, error: null, errorCode: null, details: [] };
}


export async function setCookie(user: User): Promise<{ data: any; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {

  if (!user) {
    return { data: null, error: "Error al iniciar sesión", errorCode: "UNKNOWN_ERROR", details: [] };
  }
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
    return { data: null, error: "Error al iniciar sesión", errorCode: "UNKNOWN_ERROR", details: [] };
  }

  const session = {
    id: user?.id,
    email: user?.email,
    token: token,
    githubtoken: user?.assignedgithubtoken,
    logincount: user?.logincount,
  }

  
  cookies().set('session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, 
    path: '/',
  });

  return { data: user, error: null, errorCode: null, details: [] };

}



export async function setTokenCookie({ user, token, type }: { user: User, token: string, type: string }): Promise<{ data: any | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[] }> {

  if (!user) {
    return { data: null, error: "No se pudo obtener la información del usuario", errorCode: "UNKNOWN_ERROR", details: [] };
  }

  const tokenCookie = {
    id: user?.id,
    type: type,
    email: user?.email,
    token: token
  }

  
  try {
    cookies().set('tokenCookie', JSON.stringify(tokenCookie), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 , // One hour
      path: '/',
    });
  } catch (error) {
    return { data: null, error: "Error al iniciar sesión", errorCode: "UNKNOWN_ERROR", details: [] };
  } 

  return { data: tokenCookie, error: null, errorCode: null, details: [] };

}


export async function authenticate(formData: FormData) {
  
  const inputRaw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const input = normalizeEmptyStrings(inputRaw);

  const parsed = usersPostSchema.pick({ email: true, password: true }).safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return { data: null, error: 'Error de formato', errorCode: "BAD_REQUEST", details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message })) };
  }

  const { email, password } = parsed.data;

  const payload = { email, password };

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/auth', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify(payload), 
    });

  const resJson: ApiResponse = await response.json();

  if (!response.ok) {
    console.log(resJson)
    return { data: null, error: resJson.publicError?? 'Error al iniciar sesión', errorCode: resJson.errorCode, details: resJson.details };
  }

  const res = await setCookie(resJson.data);
  if (res.error) {
    return { data: null, error: 'Error al iniciar sesión', errorCode: "UNKNOWN_ERROR", details: [] };
  }

  const updatedUser = await increaseLoginCount(resJson.data);
  if (updatedUser.error) {
    return { data: null, error: 'Error al iniciar sesión', errorCode: "UNKNOWN_ERROR", details: [] };
  }

  return { data: { user: updatedUser.data, verify: false }, error: null, errorCode: null, details: [] };
}

export async function logout(_currentState: unknown) {
  const error = await signOut()
  if (error) {
    return error
  }
}

export async function initialize() {
  const { data: user, error, errorCode } = await getUser();
  if (error || !user) return { data: null, error: error?? 'Error al inicializar la sesión', errorCode: errorCode, details: [] };
  
  const { data: updatedUser, error: increaseLoginCountError, errorCode: increaseLoginCountErrorCode } = await increaseLoginCount(user);
  if (increaseLoginCountError || !updatedUser) return { data: null, error: error?? 'Error al inicializar la sesión', errorCode: increaseLoginCountErrorCode, details: [] };
  
  const res = await setCookie(updatedUser);

  if (res.error) {
    return { data: null, error: 'Error al iniciar sesión', errorCode: "UNKNOWN_ERROR", details: [] };
  }
  
  return { data: updatedUser, error: null, errorCode: null, details: [] };
}


export async function signOut(): Promise<{ data: string | null; error: string | null; errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[]}> {
  try {
    cookies().delete('session');
  } catch (error) {
  return { data: null, error: "Error al cerrar sesión", errorCode: "UNKNOWN_ERROR", details: [] };
  }

  return { data: null, error: null, errorCode: null, details: [] };
}


export async function verifyUser({ token }: { token: string }): Promise<{ data: { ok: boolean } | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[]}> {

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': process.env.INTERNAL_API_SECRET!,
        },
        body: JSON.stringify({ token }),
      })

  const resJson: ApiResponse = await response.json();

  if (!response.ok) {
    return { data: null, error: resJson.publicError?? 'Error al verificar el correo', errorCode: resJson.errorCode, details: resJson.details };
  }

  try {
    cookies().delete('tokenCookie');
  } catch (error) {
    return { data: null, error: "Error del servidor", errorCode: "UNKNOWN_ERROR", details: [] };
  }


  return { data: resJson.data, error: null, errorCode: null, details: [] };
}



export async function forgotPassword(formData: FormData): Promise<{ data: any | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[]}> {

  const inputRaw = {
    email: formData.get("email"),
  };

  const input = normalizeEmptyStrings(inputRaw);

  const parsed = z.object({   email: z.email({ message: "Correo inválido" }).max(255, "El correo es demasiado largo"),}).safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return { data: null, error: 'Error de formato', errorCode: "BAD_REQUEST", details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message })) };
  }

  const { email } = parsed.data;

  const forgotRes = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/send-reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify({ email }),
  })
  

  const forgotResJson = await forgotRes.json();
  if (!forgotRes.ok) {
    return { data: null, error: forgotResJson.publicError?? 'Error al enviar el correo de verificación', errorCode: forgotResJson.errorCode, details: forgotResJson.details };
  }

  const forgotCookie = await setTokenCookie({ user: forgotResJson.data.user, token: forgotResJson.data.token, type: 'forgot' });

  
  return { data: forgotResJson.data, error: null, errorCode: null, details: [] };
}





export async function resetPassword(formData: FormData): Promise<{ data: any | null, error: string | null, errorCode: ErrorCode | null | undefined, details: { name: string; success: boolean, error?: string | null }[]}> {

  const inputRaw = {
    password: formData.get("password"),
    confirmPassword: formData.get("confirm_password"),
  };

  const input = normalizeEmptyStrings(inputRaw);

  const parsed = z.object({ password:z.string("La contraseña es obligatoria").min(4, "La contraseña es demasiado corta, debe tener al menos 4 caracteres"),   confirmPassword: z.string("La contraseña es obligatoria").min(4, "La contraseña es demasiado corta, debe tener al menos 4 caracteres"),}).safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues;
    return { data: null, error: 'Error de formato', errorCode: "BAD_REQUEST", details: errors.map((e) => ({ name: ERROR_MESSAGES[e.path[0].toString()], success: false, error: e.message })) };
  }

  const { password, confirmPassword } = parsed.data;
  
  const token = formData.get("token");
  
  if (password !== confirmPassword) {
    return { data: null, error: 'Las contraseñas no coinciden', errorCode: "BAD_REQUEST", details: [] };
  }


  const payload = { password, token };
  

  const response = await fetch((process.env.NEXT_PUBLIC_BASE_URL as string || process.env.BASE_URL as string) + '/api/reset-password', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_API_SECRET!,
    },
    body: JSON.stringify(payload), 
    });

  const resJson: ApiResponse = await response.json();

  if (!response.ok) {
    return { data: null, error: resJson.publicError?? 'Error al cambiar la contrase\u00f1a del usuario', errorCode: resJson.errorCode, details: resJson.details };
  }

  try {
    cookies().delete('tokenCookie');
  } catch (error) {
    return { data: null, error: "Error del servidor", errorCode: "UNKNOWN_ERROR", details: [] };
  }
  
  return { data: resJson.data, error: null, errorCode: null, details: [] };
}


