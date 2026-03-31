// src/types/example.ts
export interface ApiResponseType {
    code: string | null,
    message: string | null,
    data: object | object[] | string | null;
}
