import bcrypt from "bcrypt";
import { sql } from "@vercel/postgres";
import { jsonResponse } from "@/app/lib/helpers";



export async function POST(request: Request) {

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return jsonResponse(
      {
        error: "Invalid JSON body",
        publicError: "Petición inválida",
        errorCode: "BAD_REQUEST",
      },
      400
    );
  }

  try {
    const { email, password } = body;

    const user = (await sql`SELECT * FROM users WHERE email = ${email}`)
        .rows[0];

    if (!user) {
      return jsonResponse(
        {
          error: "User not found",
          publicError: "El usuario no existe o email incorrecto",
          errorCode: "USER_NOT_FOUND",
          details: []
        },
        404
      );
    }

    const primitiveUser = (await sql`SELECT * FROM primitive_users WHERE id = ${user.primitiveid}`)
        .rows[0]; 

    if (!primitiveUser.isverified) {
      return jsonResponse(
        {
          error: "User not verified",
          publicError: "El usuario no ha sido verificado",
          errorCode: "USER_NOT_VERIFIED",
          details: []
        },
        403
      );
    }
    

    const hashedPassword = user?.password;
  
    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
  
    if (!isPasswordValid) {
      return jsonResponse(
        {
          error: "Incorrect password",
          publicError: "Contraseña incorrecta",
          errorCode: "INCORRECT_PASSWORD",
          details: []
        },
        401
      );
    }

    return jsonResponse(
      {
        data: user,
        error: null,
        publicError: null,
        errorCode: null,
        details: []
      },
      200
    );
  } catch (error: any) {
    return jsonResponse(
      {
        error: error.message || "SQL error",
        publicError: "No se pudo autenticar",
        errorCode: "DB_AUTH_ERROR",
        details: { body, error },
      },
      500
    );
  }
}
