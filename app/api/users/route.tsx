import { sql } from '@vercel/postgres';
import { jsonResponse } from '@/app/lib/helpers';
import bcrypt from "bcrypt";
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return jsonResponse({
      error: 'Falta encabezado X-User-Id',
      publicError: 'Permiso denegado',
      errorCode: 'NO_AUTH'
    }, 401);
  }

  try {
    const result = await sql`
      SELECT id, name, publicname, year, color, role, weeklychallengesscore
      FROM users
    `;

    return jsonResponse({ data: result.rows }, 200);
  } catch (error: any) {
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_USERS_GET_FAILED'
    }, 500);
  }
}



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
        details: []
      },
      400
    );
  }

  const { name, year, email, password, key, role } = body;

  const hashedPassword = await bcrypt.hash(password, 10);

  if (key !== process.env.SIGNUP_KEY) {
    return jsonResponse({ data: null, error: "Clave incorrecta", publicError: "Clave incorrecta", errorCode: "PERMISSION_DENIED", details: [] }, 400);
  }
  
  const primitiveUser = await sql`SELECT * FROM primitive_users WHERE signedup = false AND name = ${name.toLowerCase()}`;
  
  if (primitiveUser.rows.length === 0) {
    return jsonResponse({ data: null, error: "El usuario no existe o ya se ha registrado", publicError: "El usuario no existe o ya se ha registrado", errorCode: "PERMISSION_DENIED", details: [] }, 400);
  }
  const tokens = await sql`SELECT * FROM githubtokens`;

  const tokensArray = tokens.rows.filter((token) => {
    return !token.assigned
  });

    
  if (tokensArray.length === 0) {
    return jsonResponse({ data: null, error: "Límite de usuarios alcanzado", publicError: "Límite de usuarios alcanzado", errorCode: "PERMISSION_DENIED", details: [] }, 400);
  }
  const githubtoken = tokensArray[0].githubtoken;

  try {
    const user = await 
      sql`INSERT INTO users (name, publicname, role, year, email, password, assignedgithubtoken) VALUES (${name}, ${name}, ${role}, ${year}, ${email}, ${hashedPassword}, ${githubtoken}) RETURNING *`
      .then((res) => res.rows[0]);

    await sql`UPDATE githubtokens SET assigned = true WHERE githubtoken = ${githubtoken}`;
    await sql`UPDATE primitive_users SET signedup = true WHERE name = ${name.toLowerCase()}`;

    return jsonResponse({ data: user }, 200);
  } catch (error: any) {
    if (error.code === '23505') {
      return jsonResponse({ data: null, error: "El usuario ya existe", publicError: "El usuario ya existe", errorCode: "PERMISSION_DENIED", details: [] }, 400);
    }
    return jsonResponse({
      error: error.message || String(error),
      publicError: 'Error interno, contacta al administrador si el problema persiste',
      errorCode: 'DB_USERS_POST_FAILED'
    }, 500);
  }
}