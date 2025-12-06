// Este archivo puede estar vacío o contener interfaces relacionadas con auth
export interface JwtPayload {
  sub: string;
  correo: string;
  rol: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    correo: string;
    nombre: string;
    apellidos: string;
    rol: string;
  };
}
