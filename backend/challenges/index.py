"""
Челленджи: создание, вступление по коду, список.
POST ?action=create  — создать челлендж (title, books_goal, days, emoji)
POST ?action=join    — вступить по коду (join_code)
GET  ?action=my      — мои челленджи (созданные + вступившие)
GET  ?action=info&code=XXXX — инфо о челлендже по коду (до вступления)
"""
import json
import os
import random
import string
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(cur, schema, token):
    cur.execute(f"SELECT id, name FROM {schema}.users WHERE session_token=%s", (token,))
    return cur.fetchone()

def gen_code():
    return "".join(random.choices(string.digits, k=6))

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    token = (event.get("headers") or {}).get("X-Session-Id", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        user_row = get_user(cur, schema, token)
        if not user_row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
        user_id, user_name = user_row

        # ── CREATE ──────────────────────────────────────────────────────────
        if method == "POST" and action == "create":
            body = json.loads(event.get("body") or "{}")
            title = (body.get("title") or "").strip()
            books_goal = int(body.get("books_goal") or 0)
            days = int(body.get("days") or 0)
            emoji = (body.get("emoji") or "📚").strip()

            if not title or books_goal <= 0 or days <= 0:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Укажи название, цель и срок"})}

            # Генерируем уникальный 6-значный код
            code = gen_code()
            for _ in range(10):
                cur.execute(f"SELECT id FROM {schema}.challenges WHERE join_code=%s", (code,))
                if not cur.fetchone():
                    break
                code = gen_code()

            cur.execute(
                f"""INSERT INTO {schema}.challenges (creator_id, title, books_goal, days, emoji, join_code)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                (user_id, title, books_goal, days, emoji, code)
            )
            ch_id = cur.fetchone()[0]

            # Автоматически добавляем создателя как участника
            cur.execute(
                f"INSERT INTO {schema}.challenge_members (challenge_id, user_id) VALUES (%s, %s)",
                (ch_id, user_id)
            )
            conn.commit()

            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"id": ch_id, "join_code": code, "title": title})}

        # ── JOIN ─────────────────────────────────────────────────────────────
        if method == "POST" and action == "join":
            body = json.loads(event.get("body") or "{}")
            code = (body.get("join_code") or "").strip()

            if not code:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введи код"})}

            cur.execute(
                f"SELECT id, title, books_goal, days, emoji FROM {schema}.challenges WHERE join_code=%s",
                (code,)
            )
            ch = cur.fetchone()
            if not ch:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Челлендж не найден. Проверь код"})}

            ch_id, title, books_goal, days, emoji = ch

            # Уже участник?
            cur.execute(
                f"SELECT id FROM {schema}.challenge_members WHERE challenge_id=%s AND user_id=%s",
                (ch_id, user_id)
            )
            if cur.fetchone():
                return {"statusCode": 200, "headers": CORS,
                        "body": json.dumps({"id": ch_id, "title": title, "already_member": True})}

            cur.execute(
                f"INSERT INTO {schema}.challenge_members (challenge_id, user_id) VALUES (%s, %s)",
                (ch_id, user_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"id": ch_id, "title": title, "already_member": False})}

        # ── INFO by code (preview before join) ───────────────────────────────
        if method == "GET" and action == "info":
            code = qs.get("code", "").strip()
            if not code:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет кода"})}

            cur.execute(
                f"""SELECT c.id, c.title, c.books_goal, c.days, c.emoji,
                           (SELECT COUNT(*) FROM {schema}.challenge_members WHERE challenge_id=c.id)
                    FROM {schema}.challenges c WHERE c.join_code=%s""",
                (code,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Не найден"})}

            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({
                        "id": row[0], "title": row[1], "books_goal": row[2],
                        "days": row[3], "emoji": row[4], "members": row[5]
                    })}

        # ── MY CHALLENGES ────────────────────────────────────────────────────
        if method == "GET" and action == "my":
            cur.execute(
                f"""SELECT c.id, c.title, c.books_goal, c.days, c.emoji, c.join_code,
                           cm.books_done,
                           (SELECT COUNT(*) FROM {schema}.challenge_members WHERE challenge_id=c.id),
                           c.creator_id = %s as is_creator,
                           c.created_at
                    FROM {schema}.challenges c
                    JOIN {schema}.challenge_members cm ON cm.challenge_id=c.id AND cm.user_id=%s
                    ORDER BY c.created_at DESC""",
                (user_id, user_id)
            )
            rows = cur.fetchall()
            challenges = [
                {
                    "id": r[0], "title": r[1], "books_goal": r[2],
                    "days": r[3], "emoji": r[4], "join_code": r[5],
                    "books_done": r[6], "members": r[7],
                    "is_creator": r[8], "created_at": str(r[9])
                }
                for r in rows
            ]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"challenges": challenges})}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный action"})}

    finally:
        cur.close()
        conn.close()
