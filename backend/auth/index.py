"""
Регистрация и авторизация пользователя (имя + класс).
POST /register — создать аккаунт, вернуть session_token
POST /login — войти по имени и классу (если аккаунт есть)
GET / — получить профиль по токену (X-Session-Id)
"""
import json
import os
import secrets
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # POST /register
        if method == "POST" and path.rstrip("/").endswith("register"):
            body = json.loads(event.get("body") or "{}")
            name = (body.get("name") or "").strip()
            klass = (body.get("class") or "").strip()

            if not name or not klass:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Заполни имя и класс"})}

            # Check duplicate
            cur.execute(
                f"SELECT id, session_token FROM {schema}.users WHERE name=%s AND class=%s",
                (name, klass)
            )
            row = cur.fetchone()
            if row:
                return {"statusCode": 200, "headers": CORS,
                        "body": json.dumps({"token": row[1], "user_id": row[0],
                                            "name": name, "class": klass, "existed": True})}

            token = secrets.token_hex(32)
            cur.execute(
                f"INSERT INTO {schema}.users (name, class, session_token) VALUES (%s, %s, %s) RETURNING id",
                (name, klass, token)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"token": token, "user_id": user_id,
                                        "name": name, "class": klass, "existed": False})}

        # GET / — profile by token
        if method == "GET":
            token = event.get("headers", {}).get("X-Session-Id", "")
            if not token:
                return {"statusCode": 401, "headers": CORS,
                        "body": json.dumps({"error": "Нет токена"})}

            cur.execute(
                f"SELECT id, name, class FROM {schema}.users WHERE session_token=%s",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": CORS,
                        "body": json.dumps({"error": "Пользователь не найден"})}

            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"user_id": row[0], "name": row[1], "class": row[2]})}

        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()
