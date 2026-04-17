"""
Книги пользователя.
POST / — добавить книгу (title, author, pages)
GET / — получить все книги пользователя
PUT /{id} — обновить страницы/статус/рейтинг
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_id(cur, schema, token):
    cur.execute(f"SELECT id FROM {schema}.users WHERE session_token=%s", (token,))
    row = cur.fetchone()
    return row[0] if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    token = event.get("headers", {}).get("X-Session-Id", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        user_id = get_user_id(cur, schema, token)
        if not user_id:
            return {"statusCode": 401, "headers": CORS,
                    "body": json.dumps({"error": "Не авторизован"})}

        # POST / — добавить книгу
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            title = (body.get("title") or "").strip()
            author = (body.get("author") or "").strip()
            pages = int(body.get("pages") or 0)

            if not title or not author or pages <= 0:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Заполни название, автора и количество страниц"})}

            cur.execute(
                f"INSERT INTO {schema}.books (user_id, title, author, pages, status) VALUES (%s, %s, %s, %s, 'planned') RETURNING id",
                (user_id, title, author, pages)
            )
            book_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"id": book_id, "title": title, "author": author, "pages": pages})}

        # PUT — обновить книгу (book_id передаётся в теле)
        if method == "PUT":
            body = json.loads(event.get("body") or "{}")
            book_id = body.get("book_id")
            if not book_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет ID"})}
            updates = []
            vals = []

            if "pages_read" in body:
                pr = int(body["pages_read"])
                updates.append("pages_read=%s")
                vals.append(pr)
                # Auto-update status
                cur.execute(f"SELECT pages FROM {schema}.books WHERE id=%s AND user_id=%s", (book_id, user_id))
                row = cur.fetchone()
                if row:
                    status = "done" if pr >= row[0] else ("reading" if pr > 0 else "planned")
                    updates.append("status=%s")
                    vals.append(status)

            if "status" in body:
                updates.append("status=%s")
                vals.append(body["status"])

            if "rating" in body:
                updates.append("rating=%s")
                vals.append(int(body["rating"]))

            if not updates:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нечего обновлять"})}

            vals += [book_id, user_id]
            cur.execute(
                f"UPDATE {schema}.books SET {', '.join(updates)} WHERE id=%s AND user_id=%s",
                vals
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

        # GET / — список книг + статистика
        if method == "GET":
            cur.execute(
                f"""SELECT id, title, author, pages, pages_read, status, rating, created_at
                    FROM {schema}.books WHERE user_id=%s ORDER BY created_at DESC""",
                (user_id,)
            )
            rows = cur.fetchall()
            books = [
                {
                    "id": r[0], "title": r[1], "author": r[2],
                    "pages": r[3], "pages_read": r[4], "status": r[5],
                    "rating": r[6], "created_at": str(r[7])
                }
                for r in rows
            ]

            total = len(books)
            done = sum(1 for b in books if b["status"] == "done")
            reading = sum(1 for b in books if b["status"] == "reading")
            planned = sum(1 for b in books if b["status"] == "planned")
            total_pages = sum(b["pages_read"] for b in books)

            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({
                        "books": books,
                        "stats": {
                            "total": total, "done": done,
                            "reading": reading, "planned": planned,
                            "total_pages_read": total_pages
                        }
                    })}

        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()