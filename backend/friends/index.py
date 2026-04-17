"""
Друзья пользователя.
POST ?action=add      — добавить друга по user_id (friend_user_id в теле)
POST ?action=remove   — удалить друга (friend_user_id в теле)
GET  ?action=list     — список друзей с их статистикой
GET  ?action=rating   — рейтинг друзей + я сам по кол-ву прочитанных книг
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user(cur, schema, token):
    cur.execute(f"SELECT id, name, class FROM {schema}.users WHERE session_token=%s", (token,))
    return cur.fetchone()

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
        user_id, user_name, user_class = user_row

        # ── ADD ──────────────────────────────────────────────────────────────
        if method == "POST" and action == "add":
            body = json.loads(event.get("body") or "{}")
            friend_uid = body.get("friend_user_id")

            if not friend_uid:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажи ID друга"})}
            if int(friend_uid) == user_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нельзя добавить себя"})}

            # Проверяем, что такой пользователь существует
            cur.execute(f"SELECT id, name, class FROM {schema}.users WHERE id=%s", (int(friend_uid),))
            friend_row = cur.fetchone()
            if not friend_row:
                return {"statusCode": 404, "headers": CORS,
                        "body": json.dumps({"error": f"Пользователь #{friend_uid} не найден"})}

            # Уже друг?
            cur.execute(
                f"SELECT id FROM {schema}.friends WHERE user_id=%s AND friend_id=%s",
                (user_id, int(friend_uid))
            )
            if cur.fetchone():
                return {"statusCode": 200, "headers": CORS,
                        "body": json.dumps({"already": True, "name": friend_row[1]})}

            cur.execute(
                f"INSERT INTO {schema}.friends (user_id, friend_id) VALUES (%s, %s)",
                (user_id, int(friend_uid))
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"ok": True, "name": friend_row[1], "class": friend_row[2]})}

        # ── REMOVE ───────────────────────────────────────────────────────────
        if method == "POST" and action == "remove":
            body = json.loads(event.get("body") or "{}")
            friend_uid = int(body.get("friend_user_id") or 0)
            cur.execute(
                f"DELETE FROM {schema}.friends WHERE user_id=%s AND friend_id=%s",
                (user_id, friend_uid)
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # ── LIST ─────────────────────────────────────────────────────────────
        if method == "GET" and action == "list":
            cur.execute(
                f"""SELECT u.id, u.name, u.class,
                           COUNT(b.id) FILTER (WHERE b.status='done') as books_done,
                           COUNT(b.id) as books_total
                    FROM {schema}.friends f
                    JOIN {schema}.users u ON u.id = f.friend_id
                    LEFT JOIN {schema}.books b ON b.user_id = u.id
                    WHERE f.user_id = %s
                    GROUP BY u.id, u.name, u.class
                    ORDER BY books_done DESC""",
                (user_id,)
            )
            rows = cur.fetchall()
            friends = [
                {"id": r[0], "name": r[1], "class": r[2],
                 "books_done": r[3], "books_total": r[4]}
                for r in rows
            ]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"friends": friends})}

        # ── RATING ───────────────────────────────────────────────────────────
        if method == "GET" and action == "rating":
            # Друзья
            cur.execute(
                f"""SELECT u.id, u.name, u.class,
                           COUNT(b.id) FILTER (WHERE b.status='done') as books_done,
                           COALESCE(SUM(b.pages_read), 0) as pages_read
                    FROM {schema}.friends f
                    JOIN {schema}.users u ON u.id = f.friend_id
                    LEFT JOIN {schema}.books b ON b.user_id = u.id
                    WHERE f.user_id = %s
                    GROUP BY u.id, u.name, u.class""",
                (user_id,)
            )
            rows = cur.fetchall()
            entries = [
                {"id": r[0], "name": r[1], "class": r[2],
                 "books_done": r[3], "pages_read": r[4], "is_me": False}
                for r in rows
            ]

            # Сам пользователь
            cur.execute(
                f"""SELECT COUNT(id) FILTER (WHERE status='done'), COALESCE(SUM(pages_read), 0)
                    FROM {schema}.books WHERE user_id=%s""",
                (user_id,)
            )
            my = cur.fetchone()
            entries.append({
                "id": user_id, "name": user_name, "class": user_class,
                "books_done": my[0] or 0, "pages_read": my[1] or 0, "is_me": True
            })

            # Сортируем по книгам, потом по страницам
            entries.sort(key=lambda x: (-x["books_done"], -x["pages_read"]))
            for i, e in enumerate(entries):
                e["rank"] = i + 1

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"rating": entries})}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверный action"})}

    finally:
        cur.close()
        conn.close()
